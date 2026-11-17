-- Unlog friend mutation functions v1
--
-- These functions are intentionally server-side, SECURITY INVOKER functions.
-- A function call runs inside the caller's transaction; PostgreSQL holds the
-- row locks below until that transaction finishes.

BEGIN;

CREATE FUNCTION public.friend_profile_dedupe_key_v1(
  p_name text,
  p_birth_date text,
  p_gender text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    'v1:[' ||
    to_json(p_name)::text || ',' ||
    to_json(p_birth_date)::text || ',' ||
    to_json(p_gender)::text ||
    ']';
$function$;

CREATE FUNCTION public.create_friend_connection(
  p_connection_id uuid,
  p_owner_user_id uuid,
  p_invite_code text,
  p_name text,
  p_birth_date text,
  p_gender text,
  p_day_pillar text,
  p_character_name text,
  p_image text,
  p_birth_hour text DEFAULT NULL,
  p_birth_minute text DEFAULT NULL,
  p_birth_time_unknown boolean DEFAULT NULL,
  p_calendar_type text DEFAULT NULL,
  p_created_at timestamptz DEFAULT clock_timestamp()
)
RETURNS TABLE (
  connection_id uuid,
  owner_user_id uuid,
  friend_user_id uuid,
  invite_code text,
  profile_dedupe_key text,
  created_at timestamptz,
  linked_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_locked_owner_user_id uuid;
  v_invite_owner_user_id uuid;
  v_invite_is_active boolean;
  v_profile_dedupe_key text;
  v_duplicate_connection_id uuid;
  v_friend_count bigint;
  v_created_at timestamptz := COALESCE(p_created_at, clock_timestamp());
  v_constraint_name text;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'FRIEND_MUTATION_REQUIRES_READ_COMMITTED',
      DETAIL = 'Friend count row-lock serialization requires READ COMMITTED.';
  END IF;

  SELECT u.id
  INTO v_locked_owner_user_id
  FROM public.users AS u
  WHERE u.id = p_owner_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'USER_NOT_FOUND',
      DETAIL = 'The owner user does not exist.';
  END IF;

  SELECT fi.owner_user_id, fi.is_active
  INTO v_invite_owner_user_id, v_invite_is_active
  FROM public.friend_invites AS fi
  WHERE fi.code = p_invite_code
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVITE_NOT_FOUND',
      DETAIL = 'The invite code does not exist.';
  END IF;

  IF NOT v_invite_is_active THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVITE_INACTIVE',
      DETAIL = 'The invite code is inactive.';
  END IF;

  IF v_invite_owner_user_id <> p_owner_user_id THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_INVITE_OWNER',
      DETAIL = 'The invite does not belong to the supplied owner.';
  END IF;

  IF
    p_name IS NULL OR p_name = '' OR
    p_birth_date IS NULL OR p_birth_date = '' OR
    p_gender IS NULL OR p_gender = '' OR
    p_day_pillar IS NULL OR p_day_pillar = '' OR
    p_character_name IS NULL OR p_character_name = '' OR
    p_image IS NULL OR p_image = ''
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_PROFILE',
      DETAIL = 'Required friend snapshot fields must be non-empty.';
  END IF;

  v_profile_dedupe_key := public.friend_profile_dedupe_key_v1(
    p_name,
    p_birth_date,
    p_gender
  );

  SELECT fc.id
  INTO v_duplicate_connection_id
  FROM public.friend_connections AS fc
  WHERE fc.owner_user_id = p_owner_user_id
    AND fc.profile_dedupe_key = v_profile_dedupe_key
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ALREADY_REGISTERED',
      DETAIL = format('connection_id=%s', v_duplicate_connection_id);
  END IF;

  SELECT count(*)
  INTO v_friend_count
  FROM public.friend_connections AS fc
  WHERE fc.owner_user_id = p_owner_user_id
     OR fc.friend_user_id = p_owner_user_id;

  IF v_friend_count >= 50 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'FRIEND_LIMIT_REACHED',
      DETAIL = 'A user cannot have more than 50 stored friend connections.';
  END IF;

  BEGIN
    INSERT INTO public.friend_connections (
      id,
      owner_user_id,
      friend_user_id,
      invite_code,
      profile_dedupe_key,
      created_at,
      linked_at,
      updated_at
    ) VALUES (
      p_connection_id,
      p_owner_user_id,
      NULL,
      p_invite_code,
      v_profile_dedupe_key,
      v_created_at,
      NULL,
      NULL
    );
  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;

      IF v_constraint_name = 'friend_connections_owner_profile_unique' THEN
        RAISE EXCEPTION USING
          ERRCODE = 'P0001',
          MESSAGE = 'ALREADY_REGISTERED',
          DETAIL = 'The owner already has the same v1 friend profile.';
      ELSIF v_constraint_name = 'friend_connections_pkey' THEN
        RAISE EXCEPTION USING
          ERRCODE = 'P0001',
          MESSAGE = 'CONNECTION_ID_CONFLICT',
          DETAIL = 'The supplied connection id already exists.';
      ELSE
        RAISE;
      END IF;
  END;

  INSERT INTO public.friend_connection_profiles (
    connection_id,
    name,
    birth_date,
    birth_hour,
    birth_minute,
    birth_time_unknown,
    calendar_type,
    gender,
    day_pillar,
    character_name,
    image
  ) VALUES (
    p_connection_id,
    p_name,
    p_birth_date,
    COALESCE(NULLIF(p_birth_hour, ''), '0'),
    COALESCE(NULLIF(p_birth_minute, ''), '0'),
    COALESCE(p_birth_time_unknown, false),
    COALESCE(NULLIF(p_calendar_type, ''), 'solar'),
    p_gender,
    p_day_pillar,
    p_character_name,
    p_image
  );

  RETURN QUERY
  SELECT
    fc.id,
    fc.owner_user_id,
    fc.friend_user_id,
    fc.invite_code,
    fc.profile_dedupe_key,
    fc.created_at,
    fc.linked_at,
    fc.updated_at
  FROM public.friend_connections AS fc
  WHERE fc.id = p_connection_id;
END;
$function$;

CREATE FUNCTION public.link_friend_connection_user(
  p_connection_id uuid,
  p_friend_user_id uuid,
  p_linked_at timestamptz DEFAULT clock_timestamp()
)
RETURNS TABLE (
  connection_id uuid,
  owner_user_id uuid,
  friend_user_id uuid,
  invite_code text,
  profile_dedupe_key text,
  created_at timestamptz,
  linked_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_owner_user_id uuid;
  v_existing_friend_user_id uuid;
  v_locked_user_count integer;
  v_expected_user_count integer;
  v_existing_pair_connection_id uuid;
  v_friend_count bigint;
  v_linked_at timestamptz := COALESCE(p_linked_at, clock_timestamp());
  v_constraint_name text;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'FRIEND_MUTATION_REQUIRES_READ_COMMITTED',
      DETAIL = 'Friend count row-lock serialization requires READ COMMITTED.';
  END IF;

  SELECT fc.owner_user_id, fc.friend_user_id
  INTO v_owner_user_id, v_existing_friend_user_id
  FROM public.friend_connections AS fc
  WHERE fc.id = p_connection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'CONNECTION_NOT_FOUND',
      DETAIL = 'The friend connection does not exist.';
  END IF;

  v_expected_user_count := CASE
    WHEN v_owner_user_id = p_friend_user_id THEN 1
    ELSE 2
  END;

  PERFORM u.id
  FROM public.users AS u
  WHERE u.id = v_owner_user_id
     OR u.id = p_friend_user_id
  ORDER BY u.id
  FOR UPDATE;

  GET DIAGNOSTICS v_locked_user_count = ROW_COUNT;

  IF v_locked_user_count <> v_expected_user_count THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'USER_NOT_FOUND',
      DETAIL = 'The owner or target user does not exist.';
  END IF;

  IF v_existing_friend_user_id IS NOT NULL THEN
    IF v_existing_friend_user_id = p_friend_user_id THEN
      RETURN QUERY
      SELECT
        fc.id,
        fc.owner_user_id,
        fc.friend_user_id,
        fc.invite_code,
        fc.profile_dedupe_key,
        fc.created_at,
        fc.linked_at,
        fc.updated_at
      FROM public.friend_connections AS fc
      WHERE fc.id = p_connection_id;
      RETURN;
    END IF;

    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ALREADY_LINKED',
      DETAIL = 'The friend connection is already linked to another user.';
  END IF;

  IF v_owner_user_id = p_friend_user_id THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'SELF_CONNECTION',
      DETAIL = 'A user cannot be connected to itself.';
  END IF;

  SELECT fc.id
  INTO v_existing_pair_connection_id
  FROM public.friend_connections AS fc
  WHERE fc.id <> p_connection_id
    AND fc.friend_user_id IS NOT NULL
    AND (
      (fc.owner_user_id = v_owner_user_id AND fc.friend_user_id = p_friend_user_id)
      OR
      (fc.owner_user_id = p_friend_user_id AND fc.friend_user_id = v_owner_user_id)
    )
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ALREADY_REGISTERED',
      DETAIL = format('connection_id=%s', v_existing_pair_connection_id);
  END IF;

  SELECT count(*)
  INTO v_friend_count
  FROM public.friend_connections AS fc
  WHERE fc.owner_user_id = p_friend_user_id
     OR fc.friend_user_id = p_friend_user_id;

  IF v_friend_count >= 50 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'FRIEND_LIMIT_REACHED',
      DETAIL = 'A user cannot have more than 50 stored friend connections.';
  END IF;

  BEGIN
    UPDATE public.friend_connections AS fc
    SET
      friend_user_id = p_friend_user_id,
      linked_at = v_linked_at,
      updated_at = v_linked_at
    WHERE fc.id = p_connection_id;
  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;

      IF v_constraint_name = 'friend_connections_connected_pair_uidx' THEN
        RAISE EXCEPTION USING
          ERRCODE = 'P0001',
          MESSAGE = 'ALREADY_REGISTERED',
          DETAIL = 'The two users already have another friend connection.';
      ELSE
        RAISE;
      END IF;
  END;

  RETURN QUERY
  SELECT
    fc.id,
    fc.owner_user_id,
    fc.friend_user_id,
    fc.invite_code,
    fc.profile_dedupe_key,
    fc.created_at,
    fc.linked_at,
    fc.updated_at
  FROM public.friend_connections AS fc
  WHERE fc.id = p_connection_id;
END;
$function$;

CREATE FUNCTION public.delete_friend_connection(
  p_connection_id uuid,
  p_request_user_id uuid
)
RETURNS TABLE (
  deleted_connection_id uuid
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_owner_user_id uuid;
  v_friend_user_id uuid;
  v_locked_user_count integer;
  v_expected_user_count integer;
BEGIN
  SELECT fc.owner_user_id, fc.friend_user_id
  INTO v_owner_user_id, v_friend_user_id
  FROM public.friend_connections AS fc
  WHERE fc.id = p_connection_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'CONNECTION_NOT_FOUND',
      DETAIL = 'The friend connection does not exist.';
  END IF;

  v_expected_user_count := CASE
    WHEN v_friend_user_id IS NULL THEN 1
    ELSE 2
  END;

  PERFORM u.id
  FROM public.users AS u
  WHERE u.id = v_owner_user_id
     OR u.id = v_friend_user_id
  ORDER BY u.id
  FOR UPDATE;

  GET DIAGNOSTICS v_locked_user_count = ROW_COUNT;

  IF v_locked_user_count <> v_expected_user_count THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'USER_NOT_FOUND',
      DETAIL = 'A user referenced by the connection does not exist.';
  END IF;

  IF
    p_request_user_id <> v_owner_user_id AND
    (v_friend_user_id IS NULL OR p_request_user_id <> v_friend_user_id)
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'FORBIDDEN',
      DETAIL = 'Only a party to the friend connection may delete it.';
  END IF;

  DELETE FROM public.friend_connections AS fc
  WHERE fc.id = p_connection_id;

  RETURN QUERY SELECT p_connection_id;
END;
$function$;

-- These functions are intended to be called only through the Next.js server's
-- direct PostgreSQL connection, not through an anonymous Data API role.
REVOKE ALL ON FUNCTION public.friend_profile_dedupe_key_v1(text, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_friend_connection(
  uuid, uuid, text, text, text, text, text, text, text,
  text, text, boolean, text, timestamptz
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_friend_connection_user(
  uuid, uuid, timestamptz
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_friend_connection(uuid, uuid)
  FROM PUBLIC;

COMMIT;
