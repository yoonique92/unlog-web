-- Unlog PostgreSQL schema v1
--
-- This migration defines schema objects only. It intentionally does not
-- include data migration, RLS policies, or friend mutation functions.

BEGIN;

CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL,
  updated_at timestamptz NULL
);

CREATE TABLE public.auth_identities (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  created_at timestamptz NOT NULL,

  CONSTRAINT auth_identities_user_fk
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT auth_identities_provider_check
    CHECK (provider IN ('kakao', 'naver', 'google')),
  CONSTRAINT auth_identities_provider_user_unique
    UNIQUE (provider, provider_user_id),
  CONSTRAINT auth_identities_user_provider_unique
    UNIQUE (user_id, provider)
);

CREATE TABLE public.saju_profiles (
  user_id uuid PRIMARY KEY,
  profile_name text NULL,
  birth_date date NOT NULL,
  birth_hour smallint NOT NULL,
  birth_minute smallint NOT NULL,
  birth_time_unknown boolean NOT NULL DEFAULT false,
  calendar_type text NOT NULL,
  gender text NOT NULL,
  updated_at timestamptz NULL,

  CONSTRAINT saju_profiles_user_fk
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT saju_profiles_birth_hour_check
    CHECK (birth_hour BETWEEN 0 AND 23),
  CONSTRAINT saju_profiles_birth_minute_check
    CHECK (birth_minute BETWEEN 0 AND 59),
  CONSTRAINT saju_profiles_calendar_type_check
    CHECK (calendar_type IN ('solar', 'lunar')),
  CONSTRAINT saju_profiles_gender_check
    CHECK (gender IN ('male', 'female'))
);

CREATE TABLE public.friend_invites (
  code text PRIMARY KEY,
  owner_user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,

  CONSTRAINT friend_invites_owner_fk
    FOREIGN KEY (owner_user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT friend_invites_code_not_empty_check
    CHECK (code <> '')
);

CREATE INDEX friend_invites_owner_idx
  ON public.friend_invites (owner_user_id);

CREATE UNIQUE INDEX friend_invites_one_active_per_owner_uidx
  ON public.friend_invites (owner_user_id)
  WHERE is_active = true;

CREATE TABLE public.friend_connections (
  id uuid PRIMARY KEY,
  owner_user_id uuid NOT NULL,
  friend_user_id uuid NULL,
  invite_code text NOT NULL,
  profile_dedupe_key text NOT NULL,
  created_at timestamptz NOT NULL,
  linked_at timestamptz NULL,
  updated_at timestamptz NULL,

  CONSTRAINT friend_connections_owner_fk
    FOREIGN KEY (owner_user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT friend_connections_friend_fk
    FOREIGN KEY (friend_user_id)
    REFERENCES public.users (id)
    ON DELETE RESTRICT,
  CONSTRAINT friend_connections_invite_fk
    FOREIGN KEY (invite_code)
    REFERENCES public.friend_invites (code)
    ON DELETE RESTRICT,
  CONSTRAINT friend_connections_not_self_check
    CHECK (friend_user_id IS NULL OR owner_user_id <> friend_user_id),
  CONSTRAINT friend_connections_owner_profile_unique
    UNIQUE (owner_user_id, profile_dedupe_key)
);

CREATE INDEX friend_connections_invite_idx
  ON public.friend_connections (invite_code);

CREATE INDEX friend_connections_owner_created_idx
  ON public.friend_connections (owner_user_id, created_at);

CREATE INDEX friend_connections_friend_created_idx
  ON public.friend_connections (friend_user_id, created_at)
  WHERE friend_user_id IS NOT NULL;

CREATE UNIQUE INDEX friend_connections_connected_pair_uidx
  ON public.friend_connections (
    LEAST(owner_user_id, friend_user_id),
    GREATEST(owner_user_id, friend_user_id)
  )
  WHERE friend_user_id IS NOT NULL;

CREATE TABLE public.friend_connection_profiles (
  connection_id uuid PRIMARY KEY,
  name text NOT NULL,
  birth_date text NOT NULL,
  birth_hour text NOT NULL DEFAULT '0',
  birth_minute text NOT NULL DEFAULT '0',
  birth_time_unknown boolean NOT NULL DEFAULT false,
  calendar_type text NOT NULL DEFAULT 'solar',
  gender text NOT NULL,
  day_pillar text NOT NULL,
  character_name text NOT NULL,
  image text NOT NULL,

  CONSTRAINT friend_connection_profiles_connection_fk
    FOREIGN KEY (connection_id)
    REFERENCES public.friend_connections (id)
    ON DELETE CASCADE,
  CONSTRAINT friend_connection_profiles_name_not_empty_check
    CHECK (name <> ''),
  CONSTRAINT friend_connection_profiles_birth_date_not_empty_check
    CHECK (birth_date <> ''),
  CONSTRAINT friend_connection_profiles_gender_not_empty_check
    CHECK (gender <> ''),
  CONSTRAINT friend_connection_profiles_day_pillar_not_empty_check
    CHECK (day_pillar <> ''),
  CONSTRAINT friend_connection_profiles_character_name_not_empty_check
    CHECK (character_name <> ''),
  CONSTRAINT friend_connection_profiles_image_not_empty_check
    CHECK (image <> '')
);

CREATE TABLE public.migration_import_runs (
  id uuid PRIMARY KEY,
  source_manifest jsonb NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz NULL,
  summary jsonb NULL
);

CREATE TABLE public.migration_raw_records (
  id bigserial PRIMARY KEY,
  import_run_id uuid NOT NULL,
  source_file text NOT NULL,
  source_index integer NOT NULL,
  record_type text NOT NULL,
  raw_payload jsonb NOT NULL,
  migration_status text NOT NULL,
  canonical_table text NULL,
  canonical_id text NULL,
  migration_note text NULL,

  CONSTRAINT migration_raw_records_import_run_fk
    FOREIGN KEY (import_run_id)
    REFERENCES public.migration_import_runs (id)
    ON DELETE RESTRICT,
  CONSTRAINT migration_raw_records_source_index_check
    CHECK (source_index >= 0),
  CONSTRAINT migration_raw_records_source_position_unique
    UNIQUE (import_run_id, source_file, source_index)
);

CREATE INDEX migration_raw_records_status_idx
  ON public.migration_raw_records (migration_status);

COMMIT;
