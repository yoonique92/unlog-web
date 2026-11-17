-- Unlog social user mutation functions v1
--
-- This function is intended for the Next.js server's direct PostgreSQL
-- connection. It atomically resolves or creates one user for one provider
-- identity and never stores a provider-supplied display name.

BEGIN;

CREATE FUNCTION public.find_or_create_social_user(
  p_provider text,
  p_provider_user_id text,
  p_user_id uuid
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  provider text,
  provider_user_id text,
  created_at timestamptz,
  created boolean
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user_id uuid;
  v_display_name text;
  v_provider text;
  v_provider_user_id text;
  v_created_at timestamptz;
  v_constraint_name text;
BEGIN
  IF p_provider IS NULL OR p_provider NOT IN ('kakao', 'naver', 'google') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_PROVIDER',
      DETAIL = 'The provider must be kakao, naver, or google.';
  END IF;

  IF p_provider_user_id IS NULL OR p_provider_user_id = '' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_PROVIDER_USER_ID',
      DETAIL = 'The provider user id must be a non-empty string.';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_USER_ID',
      DETAIL = 'The candidate user id must not be null.';
  END IF;

  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'SOCIAL_USER_REQUIRES_READ_COMMITTED',
      DETAIL = 'Concurrent identity conflict recovery requires READ COMMITTED.';
  END IF;

  -- Serialize all calls for the exact provider identity across server
  -- processes. A 64-bit hash collision can only add harmless serialization;
  -- the unique constraint remains the final identity-integrity guarantee.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      pg_catalog.jsonb_build_array(p_provider, p_provider_user_id)::text,
      0
    )
  );

  SELECT
    u.id,
    u.display_name,
    ai.provider,
    ai.provider_user_id,
    u.created_at
  INTO
    v_user_id,
    v_display_name,
    v_provider,
    v_provider_user_id,
    v_created_at
  FROM public.auth_identities AS ai
  JOIN public.users AS u
    ON u.id = ai.user_id
  WHERE ai.provider = p_provider
    AND ai.provider_user_id = p_provider_user_id
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_user_id,
      v_display_name,
      v_provider,
      v_provider_user_id,
      v_created_at,
      false;
    RETURN;
  END IF;

  v_created_at := pg_catalog.clock_timestamp();

  -- This exception block is a PostgreSQL subtransaction. If the identity
  -- insert loses a unique race, the candidate users row inserted here is
  -- rolled back before the winning identity is selected.
  BEGIN
    INSERT INTO public.users (
      id,
      display_name,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      '',
      v_created_at,
      NULL
    );

    INSERT INTO public.auth_identities (
      id,
      user_id,
      provider,
      provider_user_id,
      created_at
    ) VALUES (
      pg_catalog.gen_random_uuid(),
      p_user_id,
      p_provider,
      p_provider_user_id,
      v_created_at
    );
  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;

      IF v_constraint_name = 'auth_identities_provider_user_unique' THEN
        SELECT
          u.id,
          u.display_name,
          ai.provider,
          ai.provider_user_id,
          u.created_at
        INTO
          v_user_id,
          v_display_name,
          v_provider,
          v_provider_user_id,
          v_created_at
        FROM public.auth_identities AS ai
        JOIN public.users AS u
          ON u.id = ai.user_id
        WHERE ai.provider = p_provider
          AND ai.provider_user_id = p_provider_user_id
        LIMIT 1;

        IF NOT FOUND THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'SOCIAL_IDENTITY_CONFLICT',
            DETAIL = 'The winning provider identity could not be read.';
        END IF;

        RETURN QUERY
        SELECT
          v_user_id,
          v_display_name,
          v_provider,
          v_provider_user_id,
          v_created_at,
          false;
        RETURN;
      ELSIF v_constraint_name = 'users_pkey' THEN
        RAISE EXCEPTION USING
          ERRCODE = 'P0001',
          MESSAGE = 'USER_ID_CONFLICT',
          DETAIL = 'The candidate user id already exists.';
      ELSE
        RAISE;
      END IF;
  END;

  RETURN QUERY
  SELECT
    p_user_id,
    ''::text,
    p_provider,
    p_provider_user_id,
    v_created_at,
    true;
END;
$function$;

-- This function is called only through the Next.js server's direct
-- PostgreSQL connection, not through an anonymous Data API role.
REVOKE ALL ON FUNCTION public.find_or_create_social_user(text, text, uuid)
  FROM PUBLIC;

COMMIT;
