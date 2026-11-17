-- Unlog stone wallet, ledger, and content unlock schema v1
--
-- This migration defines schema objects only. Stone mutations and payment
-- integration are intentionally deferred to later migrations.

BEGIN;

CREATE TABLE public.user_stone_wallets (
  user_id uuid PRIMARY KEY,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_stone_wallets_user_fk
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT user_stone_wallets_balance_check
    CHECK (balance >= 0)
);

CREATE TABLE public.stone_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  entry_type text NOT NULL,
  idempotency_key text NOT NULL,
  request_fingerprint text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT stone_ledger_entries_user_fk
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT stone_ledger_entries_delta_check
    CHECK (delta <> 0),
  CONSTRAINT stone_ledger_entries_balance_after_check
    CHECK (balance_after >= 0),
  CONSTRAINT stone_ledger_entries_entry_type_not_empty_check
    CHECK (entry_type <> ''),
  CONSTRAINT stone_ledger_entries_idempotency_key_not_empty_check
    CHECK (idempotency_key <> ''),
  CONSTRAINT stone_ledger_entries_request_fingerprint_not_empty_check
    CHECK (request_fingerprint <> ''),
  CONSTRAINT stone_ledger_entries_user_idempotency_unique
    UNIQUE (user_id, idempotency_key)
);

CREATE INDEX stone_ledger_entries_user_created_idx
  ON public.stone_ledger_entries (user_id, created_at);

CREATE TABLE public.content_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL,
  content_key text NOT NULL,
  cost_stones integer NOT NULL,
  debit_ledger_entry_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT content_unlocks_user_fk
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT content_unlocks_debit_ledger_entry_fk
    FOREIGN KEY (debit_ledger_entry_id)
    REFERENCES public.stone_ledger_entries (id)
    ON DELETE RESTRICT,
  CONSTRAINT content_unlocks_content_type_not_empty_check
    CHECK (content_type <> ''),
  CONSTRAINT content_unlocks_content_key_not_empty_check
    CHECK (content_key <> ''),
  CONSTRAINT content_unlocks_cost_stones_check
    CHECK (cost_stones > 0),
  CONSTRAINT content_unlocks_debit_ledger_entry_unique
    UNIQUE (debit_ledger_entry_id),
  CONSTRAINT content_unlocks_user_content_unique
    UNIQUE (user_id, content_type, content_key)
);

COMMIT;
