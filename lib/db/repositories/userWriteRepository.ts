import "server-only";

import { getPostgresClient } from "../postgres";
import type { CalendarType, Gender } from "./userRepository";

export type UpsertUserSajuProfileInput = {
  userId: string;
  name: string;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: Gender;
};

export type SavedSajuProfile = {
  userId: string;
  name: string;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: Gender;
  updatedAt: string;
};

export type UpsertUserSajuProfileResult = {
  id: string;
  displayName: string;
  sajuProfile: SavedSajuProfile;
};

export type UserWriteRepositoryErrorCode =
  | "USER_NOT_FOUND"
  | "SAJU_PROFILE_CONSTRAINT_VIOLATION";

export class UserWriteRepositoryError extends Error {
  readonly code: UserWriteRepositoryErrorCode;

  constructor(code: UserWriteRepositoryErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "UserWriteRepositoryError";
    this.code = code;
  }
}

type UserLockRow = {
  id: string;
};

type UpdatedUserRow = {
  id: string;
  display_name: string;
};

type SajuProfileRow = {
  user_id: string;
  profile_name: string;
  birth_date: string | Date;
  birth_hour: number;
  birth_minute: number;
  birth_time_unknown: boolean;
  calendar_type: CalendarType;
  gender: Gender;
  updated_at: string | Date;
};

type PostgresErrorLike = Error & {
  code?: string;
};

const SAJU_PROFILE_DATABASE_ERROR_CODES = new Set([
  "22003", // numeric_value_out_of_range
  "22007", // invalid_datetime_format
  "22008", // datetime_field_overflow
  "22P02", // invalid_text_representation
  "23502", // not_null_violation
  "23503", // foreign_key_violation
  "23514", // check_violation
]);

function isSajuProfileDatabaseError(error: unknown): error is PostgresErrorLike {
  return (
    error instanceof Error &&
    typeof (error as PostgresErrorLike).code === "string" &&
    SAJU_PROFILE_DATABASE_ERROR_CODES.has((error as PostgresErrorLike).code as string)
  );
}

function toDateString(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

function toIsoTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapSajuProfile(row: SajuProfileRow): SavedSajuProfile {
  return {
    userId: row.user_id,
    name: row.profile_name,
    birthDate: toDateString(row.birth_date),
    birthHour: row.birth_hour,
    birthMinute: row.birth_minute,
    birthTimeUnknown: row.birth_time_unknown,
    calendarType: row.calendar_type,
    gender: row.gender,
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}

/**
 * Persists values that the users/saju API has already validated and normalized.
 * Input validation belongs to the API boundary; this repository only guarantees
 * that the user name and saju profile are written atomically.
 */
export async function upsertUserSajuProfile(
  input: UpsertUserSajuProfileInput
): Promise<UpsertUserSajuProfileResult> {
  const sql = getPostgresClient();

  try {
    return await sql.begin(async (transaction) => {
      const lockedUsers = await transaction<UserLockRow[]>`
        SELECT id::text AS id
        FROM public.users
        WHERE id = ${input.userId}::uuid
        FOR UPDATE
      `;

      if (!lockedUsers[0]) {
        throw new UserWriteRepositoryError("USER_NOT_FOUND");
      }

      const updatedUsers = await transaction<UpdatedUserRow[]>`
        UPDATE public.users
        SET display_name = ${input.name}
        WHERE id = ${input.userId}::uuid
        RETURNING id::text AS id, display_name
      `;

      const profiles = await transaction<SajuProfileRow[]>`
        INSERT INTO public.saju_profiles (
          user_id,
          profile_name,
          birth_date,
          birth_hour,
          birth_minute,
          birth_time_unknown,
          calendar_type,
          gender,
          updated_at
        ) VALUES (
          ${input.userId}::uuid,
          ${input.name},
          ${input.birthDate}::date,
          ${input.birthHour},
          ${input.birthMinute},
          ${input.birthTimeUnknown},
          ${input.calendarType},
          ${input.gender},
          pg_catalog.clock_timestamp()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          profile_name = EXCLUDED.profile_name,
          birth_date = EXCLUDED.birth_date,
          birth_hour = EXCLUDED.birth_hour,
          birth_minute = EXCLUDED.birth_minute,
          birth_time_unknown = EXCLUDED.birth_time_unknown,
          calendar_type = EXCLUDED.calendar_type,
          gender = EXCLUDED.gender,
          updated_at = EXCLUDED.updated_at
        RETURNING
          user_id::text AS user_id,
          profile_name,
          birth_date,
          birth_hour,
          birth_minute,
          birth_time_unknown,
          calendar_type,
          gender,
          updated_at
      `;

      return {
        id: updatedUsers[0].id,
        displayName: updatedUsers[0].display_name,
        sajuProfile: mapSajuProfile(profiles[0]),
      };
    });
  } catch (error) {
    if (error instanceof UserWriteRepositoryError) throw error;
    if (isSajuProfileDatabaseError(error)) {
      throw new UserWriteRepositoryError("SAJU_PROFILE_CONSTRAINT_VIOLATION", {
        cause: error,
      });
    }
    throw error;
  }
}
