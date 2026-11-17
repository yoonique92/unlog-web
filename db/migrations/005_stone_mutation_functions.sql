-- Unlog stone mutation functions v1
--
-- These functions serialize every stone mutation for one user by locking the
-- users row before reading wallet, ledger, or unlock state. They are intended
-- to be called only through the Next.js server's direct PostgreSQL connection.

BEGIN;

CREATE FUNCTION public.grant_stones(
  p_user_id uuid,
  p_amount integer,
  p_entry_type text,
  p_idempotency_key text,
  p_request_fingerprint text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  ledger_entry_id uuid,
  wallet_balance integer,
  created boolean
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_locked_user_id uuid;
  v_wallet_balance integer;
  v_existing_ledger_entry_id uuid;
  v_existing_delta integer;
  v_existing_entry_type text;
  v_existing_request_fingerprint text;
  v_ledger_entry_id uuid;
  v_mutated_at timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_STONE_AMOUNT',
      DETAIL = 'The grant amount must be a positive integer.';
  END IF;

  IF p_entry_type IS NULL OR p_entry_type = '' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_STONE_ENTRY_TYPE',
      DETAIL = 'The ledger entry type must be a non-empty string.';
  END IF;

  IF
    p_idempotency_key IS NULL OR p_idempotency_key = '' OR
    p_request_fingerprint IS NULL OR p_request_fingerprint = ''
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_IDEMPOTENCY',
      DETAIL = 'The idempotency key and request fingerprint must be non-empty strings.';
  END IF;

  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'STONE_MUTATION_REQUIRES_READ_COMMITTED',
      DETAIL = 'Stone mutation row-lock serialization requires READ COMMITTED.';
  END IF;

  SELECT u.id
  INTO v_locked_user_id
  FROM public.users AS u
  WHERE u.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'USER_NOT_FOUND',
      DETAIL = 'The user does not exist.';
  END IF;

  INSERT INTO public.user_stone_wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT usw.balance
  INTO v_wallet_balance
  FROM public.user_stone_wallets AS usw
  WHERE usw.user_id = p_user_id
  FOR UPDATE;

  SELECT
    sle.id,
    sle.delta,
    sle.entry_type,
    sle.request_fingerprint
  INTO
    v_existing_ledger_entry_id,
    v_existing_delta,
    v_existing_entry_type,
    v_existing_request_fingerprint
  FROM public.stone_ledger_entries AS sle
  WHERE sle.user_id = p_user_id
    AND sle.idempotency_key = p_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    IF
      v_existing_request_fingerprint <> p_request_fingerprint OR
      v_existing_delta <> p_amount OR
      v_existing_entry_type <> p_entry_type
    THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'STONE_IDEMPOTENCY_CONFLICT',
        DETAIL = 'The idempotency key was already used for a different stone mutation request.';
    END IF;

    RETURN QUERY
    SELECT
      v_existing_ledger_entry_id,
      v_wallet_balance,
      false;
    RETURN;
  END IF;

  UPDATE public.user_stone_wallets AS usw
  SET
    balance = usw.balance + p_amount,
    updated_at = v_mutated_at
  WHERE usw.user_id = p_user_id
  RETURNING usw.balance INTO v_wallet_balance;

  INSERT INTO public.stone_ledger_entries AS sle (
    user_id,
    delta,
    balance_after,
    entry_type,
    idempotency_key,
    request_fingerprint,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    v_wallet_balance,
    p_entry_type,
    p_idempotency_key,
    p_request_fingerprint,
    COALESCE(p_metadata, '{}'::jsonb),
    v_mutated_at
  )
  RETURNING sle.id INTO v_ledger_entry_id;

  RETURN QUERY
  SELECT
    v_ledger_entry_id,
    v_wallet_balance,
    true;
END;
$function$;

CREATE FUNCTION public.unlock_content_with_stones(
  p_user_id uuid,
  p_content_type text,
  p_content_key text,
  p_cost_stones integer,
  p_idempotency_key text,
  p_request_fingerprint text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  unlock_id uuid,
  ledger_entry_id uuid,
  wallet_balance integer,
  created boolean
)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_locked_user_id uuid;
  v_wallet_balance integer;
  v_existing_unlock_id uuid;
  v_existing_unlock_ledger_entry_id uuid;
  v_existing_unlock_content_type text;
  v_existing_unlock_content_key text;
  v_existing_unlock_cost_stones integer;
  v_existing_ledger_entry_id uuid;
  v_existing_ledger_entry_type text;
  v_existing_ledger_delta integer;
  v_existing_request_fingerprint text;
  v_ledger_entry_id uuid;
  v_unlock_id uuid;
  v_mutated_at timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF
    p_content_type IS NULL OR p_content_type = '' OR
    p_content_key IS NULL OR p_content_key = ''
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_CONTENT',
      DETAIL = 'The content type and content key must be non-empty strings.';
  END IF;

  IF p_cost_stones IS NULL OR p_cost_stones <= 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_STONE_COST',
      DETAIL = 'The stone cost must be a positive integer.';
  END IF;

  IF
    p_idempotency_key IS NULL OR p_idempotency_key = '' OR
    p_request_fingerprint IS NULL OR p_request_fingerprint = ''
  THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVALID_IDEMPOTENCY',
      DETAIL = 'The idempotency key and request fingerprint must be non-empty strings.';
  END IF;

  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'STONE_MUTATION_REQUIRES_READ_COMMITTED',
      DETAIL = 'Stone mutation row-lock serialization requires READ COMMITTED.';
  END IF;

  SELECT u.id
  INTO v_locked_user_id
  FROM public.users AS u
  WHERE u.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'USER_NOT_FOUND',
      DETAIL = 'The user does not exist.';
  END IF;

  INSERT INTO public.user_stone_wallets (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT usw.balance
  INTO v_wallet_balance
  FROM public.user_stone_wallets AS usw
  WHERE usw.user_id = p_user_id
  FOR UPDATE;

  SELECT
    cu.id,
    cu.debit_ledger_entry_id
  INTO
    v_existing_unlock_id,
    v_existing_unlock_ledger_entry_id
  FROM public.content_unlocks AS cu
  WHERE cu.user_id = p_user_id
    AND cu.content_type = p_content_type
    AND cu.content_key = p_content_key
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_existing_unlock_id,
      v_existing_unlock_ledger_entry_id,
      v_wallet_balance,
      false;
    RETURN;
  END IF;

  SELECT
    sle.id,
    sle.entry_type,
    sle.delta,
    sle.request_fingerprint,
    cu.id,
    cu.content_type,
    cu.content_key,
    cu.cost_stones
  INTO
    v_existing_ledger_entry_id,
    v_existing_ledger_entry_type,
    v_existing_ledger_delta,
    v_existing_request_fingerprint,
    v_existing_unlock_id,
    v_existing_unlock_content_type,
    v_existing_unlock_content_key,
    v_existing_unlock_cost_stones
  FROM public.stone_ledger_entries AS sle
  LEFT JOIN public.content_unlocks AS cu
    ON cu.debit_ledger_entry_id = sle.id
  WHERE sle.user_id = p_user_id
    AND sle.idempotency_key = p_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    IF
      v_existing_request_fingerprint <> p_request_fingerprint OR
      v_existing_ledger_entry_type <> 'content_unlock' OR
      v_existing_ledger_delta <> -p_cost_stones OR
      v_existing_unlock_id IS NULL OR
      v_existing_unlock_content_type <> p_content_type OR
      v_existing_unlock_content_key <> p_content_key OR
      v_existing_unlock_cost_stones <> p_cost_stones
    THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'STONE_IDEMPOTENCY_CONFLICT',
        DETAIL = 'The idempotency key was already used for a different stone mutation request.';
    END IF;

    RETURN QUERY
    SELECT
      v_existing_unlock_id,
      v_existing_ledger_entry_id,
      v_wallet_balance,
      false;
    RETURN;
  END IF;

  IF v_wallet_balance < p_cost_stones THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INSUFFICIENT_STONES',
      DETAIL = 'The wallet does not have enough stones for this content unlock.';
  END IF;

  UPDATE public.user_stone_wallets AS usw
  SET
    balance = usw.balance - p_cost_stones,
    updated_at = v_mutated_at
  WHERE usw.user_id = p_user_id
  RETURNING usw.balance INTO v_wallet_balance;

  INSERT INTO public.stone_ledger_entries AS sle (
    user_id,
    delta,
    balance_after,
    entry_type,
    idempotency_key,
    request_fingerprint,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    -p_cost_stones,
    v_wallet_balance,
    'content_unlock',
    p_idempotency_key,
    p_request_fingerprint,
    COALESCE(p_metadata, '{}'::jsonb),
    v_mutated_at
  )
  RETURNING sle.id INTO v_ledger_entry_id;

  INSERT INTO public.content_unlocks AS cu (
    user_id,
    content_type,
    content_key,
    cost_stones,
    debit_ledger_entry_id,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_content_type,
    p_content_key,
    p_cost_stones,
    v_ledger_entry_id,
    COALESCE(p_metadata, '{}'::jsonb),
    v_mutated_at
  )
  RETURNING cu.id INTO v_unlock_id;

  RETURN QUERY
  SELECT
    v_unlock_id,
    v_ledger_entry_id,
    v_wallet_balance,
    true;
END;
$function$;

-- These functions are called only through the Next.js server's direct
-- PostgreSQL connection, not through an anonymous Data API role.
REVOKE ALL ON FUNCTION public.grant_stones(
  uuid, integer, text, text, text, jsonb
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unlock_content_with_stones(
  uuid, text, text, integer, text, text, jsonb
) FROM PUBLIC;

COMMIT;
