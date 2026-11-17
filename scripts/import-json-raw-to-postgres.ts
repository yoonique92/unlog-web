import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import postgres from "postgres";

type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type MigrationStatus = "migrated_candidate" | "needs_review";
type RecordType = "user" | "friend_invite" | "friend_connection";

type SourceDefinition = {
  sourceFile: string;
  recordType: RecordType;
  expectedRows: number;
};

type LoadedSource = SourceDefinition & {
  checksum: string;
  rows: JsonValue[];
};

type RawRecord = {
  sourceFile: string;
  sourceIndex: number;
  recordType: RecordType;
  rawPayload: JsonValue;
  migrationStatus: MigrationStatus;
  reasons: string[];
};

const { loadEnvConfig } = nextEnv;
const IMPORT_VERSION = "json_raw_import_v1";
const EXPECTED_MIGRATED_CANDIDATES = 7;
const EXPECTED_NEEDS_REVIEW = 10;
const ALLOWED_PROVIDERS = new Set(["kakao", "naver", "google"]);
const ALLOWED_CALENDAR_TYPES = new Set(["solar", "lunar"]);
const ALLOWED_GENDERS = new Set(["male", "female"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const SOURCES: SourceDefinition[] = [
  {
    sourceFile: "data/users.json",
    recordType: "user",
    expectedRows: 3,
  },
  {
    sourceFile: "data/friend-invites.json",
    recordType: "friend_invite",
    expectedRows: 13,
  },
  {
    sourceFile: "data/friend-connections.json",
    recordType: "friend_connection",
    expectedRows: 1,
  },
];

class DuplicateImportError extends Error {
  constructor() {
    super("The same source manifest has already been imported.");
    this.name = "DuplicateImportError";
  }
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: JsonValue | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyString(value: JsonValue | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function isTimestamp(value: JsonValue | undefined): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function isDate(value: JsonValue | undefined): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isIntegerInRange(
  value: JsonValue | undefined,
  minimum: number,
  maximum: number
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function addReason(reasons: string[], condition: boolean, reason: string) {
  if (condition) reasons.push(reason);
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

async function loadSource(definition: SourceDefinition): Promise<LoadedSource> {
  const absolutePath = path.join(process.cwd(), definition.sourceFile);
  const contents = await readFile(absolutePath);
  const parsed: unknown = JSON.parse(contents.toString("utf8"));

  if (!Array.isArray(parsed)) {
    throw new Error(`${definition.sourceFile}: root value is not an array`);
  }

  if (parsed.length !== definition.expectedRows) {
    throw new Error(
      `${definition.sourceFile}: expected ${definition.expectedRows} rows, found ${parsed.length}`
    );
  }

  return {
    ...definition,
    checksum: `sha256:${sha256(contents)}`,
    rows: parsed as JsonValue[],
  };
}

function analyzeSajuProfile(profile: JsonValue | undefined) {
  const reasons: string[] = [];
  if (!isObject(profile)) return ["saju_profile_not_object"];

  addReason(
    reasons,
    profile.name !== undefined &&
      profile.name !== null &&
      typeof profile.name !== "string",
    "saju_profile_invalid_profile_name"
  );
  addReason(
    reasons,
    !isDate(profile.birthDate),
    "saju_profile_invalid_birth_date"
  );
  addReason(
    reasons,
    !isIntegerInRange(profile.birthHour, 0, 23),
    "saju_profile_invalid_birth_hour"
  );
  addReason(
    reasons,
    !isIntegerInRange(profile.birthMinute, 0, 59),
    "saju_profile_invalid_birth_minute"
  );
  addReason(
    reasons,
    profile.birthTimeUnknown !== undefined &&
      typeof profile.birthTimeUnknown !== "boolean",
    "saju_profile_invalid_birth_time_unknown"
  );
  addReason(
    reasons,
    typeof profile.calendarType !== "string" ||
      !ALLOWED_CALENDAR_TYPES.has(profile.calendarType),
    "saju_profile_invalid_calendar_type"
  );
  addReason(
    reasons,
    typeof profile.gender !== "string" ||
      !ALLOWED_GENDERS.has(profile.gender),
    "saju_profile_invalid_gender"
  );

  return reasons;
}

function analyzeFriendProfile(profile: JsonValue | undefined) {
  const reasons: string[] = [];
  if (!isObject(profile)) {
    return { reasons: ["friend_profile_not_object"], dedupeKey: null };
  }

  for (const field of [
    "name",
    "birthDate",
    "gender",
    "dayPillar",
    "characterName",
    "image",
  ]) {
    addReason(
      reasons,
      !isNonEmptyString(profile[field]),
      `friend_profile_invalid_${field}`
    );
  }

  for (const field of ["birthHour", "birthMinute"]) {
    addReason(
      reasons,
      profile[field] !== undefined &&
        profile[field] !== null &&
        typeof profile[field] !== "string",
      `friend_profile_invalid_${field}`
    );
  }

  addReason(
    reasons,
    profile.birthTimeUnknown !== undefined &&
      profile.birthTimeUnknown !== null &&
      typeof profile.birthTimeUnknown !== "boolean",
    "friend_profile_invalid_birthTimeUnknown"
  );
  addReason(
    reasons,
    profile.calendarType !== undefined &&
      profile.calendarType !== null &&
      (typeof profile.calendarType !== "string" ||
        !ALLOWED_CALENDAR_TYPES.has(profile.calendarType)),
    "friend_profile_invalid_calendarType"
  );

  const dedupeKey =
    typeof profile.name === "string" &&
    typeof profile.birthDate === "string" &&
    typeof profile.gender === "string"
      ? "v1:" +
        JSON.stringify([profile.name, profile.birthDate, profile.gender])
      : null;

  return { reasons, dedupeKey };
}

function classifySources(sources: LoadedSource[]) {
  const usersSource = sources.find((source) => source.recordType === "user");
  const invitesSource = sources.find(
    (source) => source.recordType === "friend_invite"
  );
  const connectionsSource = sources.find(
    (source) => source.recordType === "friend_connection"
  );

  if (!usersSource || !invitesSource || !connectionsSource) {
    throw new Error("One or more required JSON sources are missing.");
  }

  const rawRecords: RawRecord[] = [];
  const userIdCounts = new Map<string, number>();
  const identityCounts = new Map<string, number>();

  for (const value of usersSource.rows) {
    if (!isObject(value)) continue;
    if (typeof value.id === "string") {
      userIdCounts.set(value.id, (userIdCounts.get(value.id) ?? 0) + 1);
    }
    if (typeof value.provider === "string" && typeof value.providerUserId === "string") {
      const key = JSON.stringify([value.provider, value.providerUserId]);
      identityCounts.set(key, (identityCounts.get(key) ?? 0) + 1);
    }
  }

  const validUserIds = new Set<string>();
  usersSource.rows.forEach((rawPayload, sourceIndex) => {
    const reasons: string[] = [];

    if (!isObject(rawPayload)) {
      reasons.push("user_not_object");
    } else {
      addReason(reasons, !isUuid(rawPayload.id), "user_invalid_uuid");
      addReason(
        reasons,
        typeof rawPayload.name !== "string",
        "user_invalid_display_name"
      );
      addReason(
        reasons,
        !isTimestamp(rawPayload.createdAt),
        "user_invalid_created_at"
      );
      addReason(
        reasons,
        typeof rawPayload.id === "string" &&
          (userIdCounts.get(rawPayload.id) ?? 0) > 1,
        "user_duplicate_id"
      );

      const userTableCandidate = reasons.length === 0;
      if (userTableCandidate) validUserIds.add(rawPayload.id as string);

      addReason(
        reasons,
        typeof rawPayload.provider !== "string" ||
          !ALLOWED_PROVIDERS.has(rawPayload.provider),
        "auth_identity_invalid_provider"
      );
      addReason(
        reasons,
        !isNonEmptyString(rawPayload.providerUserId),
        "auth_identity_missing_provider_user_id"
      );

      if (
        typeof rawPayload.provider === "string" &&
        typeof rawPayload.providerUserId === "string"
      ) {
        const identityKey = JSON.stringify([
          rawPayload.provider,
          rawPayload.providerUserId,
        ]);
        addReason(
          reasons,
          (identityCounts.get(identityKey) ?? 0) > 1,
          "auth_identity_duplicate_provider_user_id"
        );
      }

      if (rawPayload.sajuProfile !== undefined && rawPayload.sajuProfile !== null) {
        reasons.push(...analyzeSajuProfile(rawPayload.sajuProfile));
      }
    }

    rawRecords.push({
      sourceFile: usersSource.sourceFile,
      sourceIndex,
      recordType: usersSource.recordType,
      rawPayload,
      migrationStatus: reasons.length === 0 ? "migrated_candidate" : "needs_review",
      reasons: [...new Set(reasons)],
    });
  });

  const inviteCodeCounts = new Map<string, number>();
  for (const value of invitesSource.rows) {
    if (isObject(value) && typeof value.code === "string") {
      inviteCodeCounts.set(value.code, (inviteCodeCounts.get(value.code) ?? 0) + 1);
    }
  }

  const validInviteCodes = new Set<string>();
  const validInviteOwners = new Map<string, string>();
  invitesSource.rows.forEach((rawPayload, sourceIndex) => {
    const reasons: string[] = [];
    const structuralReasons: string[] = [];

    if (!isObject(rawPayload)) {
      reasons.push("invite_not_object");
      structuralReasons.push("invite_not_object");
    } else {
      const ownerExists =
        isUuid(rawPayload.ownerId) && validUserIds.has(rawPayload.ownerId);
      addReason(reasons, !ownerExists, "invite_orphan_owner");
      addReason(structuralReasons, !ownerExists, "invite_orphan_owner");
      addReason(reasons, !isNonEmptyString(rawPayload.code), "invite_invalid_code");
      addReason(
        structuralReasons,
        !isNonEmptyString(rawPayload.code),
        "invite_invalid_code"
      );
      addReason(
        reasons,
        !isUuid(rawPayload.ownerId),
        "invite_invalid_owner_uuid"
      );
      addReason(
        structuralReasons,
        !isUuid(rawPayload.ownerId),
        "invite_invalid_owner_uuid"
      );
      addReason(
        reasons,
        typeof rawPayload.code === "string" &&
          (inviteCodeCounts.get(rawPayload.code) ?? 0) > 1,
        "invite_duplicate_code"
      );
      addReason(
        structuralReasons,
        typeof rawPayload.code === "string" &&
          (inviteCodeCounts.get(rawPayload.code) ?? 0) > 1,
        "invite_duplicate_code"
      );
      addReason(
        reasons,
        !isTimestamp(rawPayload.createdAt),
        "invite_invalid_created_at"
      );
      addReason(
        structuralReasons,
        !isTimestamp(rawPayload.createdAt),
        "invite_invalid_created_at"
      );

      if (rawPayload.friend !== undefined) {
        reasons.push("invite_legacy_friend_requires_review");
      }

      if (
        ownerExists &&
        structuralReasons.length === 0 &&
        typeof rawPayload.code === "string"
      ) {
        validInviteCodes.add(rawPayload.code);
        validInviteOwners.set(rawPayload.code, rawPayload.ownerId as string);
      }
    }

    rawRecords.push({
      sourceFile: invitesSource.sourceFile,
      sourceIndex,
      recordType: invitesSource.recordType,
      rawPayload,
      migrationStatus: reasons.length === 0 ? "migrated_candidate" : "needs_review",
      reasons: [...new Set(reasons)],
    });
  });

  const connectionIdCounts = new Map<string, number>();
  const ownerProfileCounts = new Map<string, number>();
  const connectedPairCounts = new Map<string, number>();
  const connectionProfiles = connectionsSource.rows.map((value) =>
    isObject(value) ? analyzeFriendProfile(value.friendProfile) : null
  );

  connectionsSource.rows.forEach((value, sourceIndex) => {
    if (!isObject(value)) return;
    if (typeof value.id === "string") {
      connectionIdCounts.set(value.id, (connectionIdCounts.get(value.id) ?? 0) + 1);
    }

    const dedupeKey = connectionProfiles[sourceIndex]?.dedupeKey;
    if (typeof value.ownerUserId === "string" && dedupeKey) {
      const key = JSON.stringify([value.ownerUserId, dedupeKey]);
      ownerProfileCounts.set(key, (ownerProfileCounts.get(key) ?? 0) + 1);
    }

    if (typeof value.ownerUserId === "string" && typeof value.friendUserId === "string") {
      const key = JSON.stringify([value.ownerUserId, value.friendUserId].sort());
      connectedPairCounts.set(key, (connectedPairCounts.get(key) ?? 0) + 1);
    }
  });

  connectionsSource.rows.forEach((rawPayload, sourceIndex) => {
    const reasons: string[] = [];

    if (!isObject(rawPayload)) {
      reasons.push("connection_not_object");
    } else {
      addReason(reasons, !isUuid(rawPayload.id), "connection_invalid_uuid");
      addReason(
        reasons,
        typeof rawPayload.id === "string" &&
          (connectionIdCounts.get(rawPayload.id) ?? 0) > 1,
        "connection_duplicate_id"
      );
      addReason(
        reasons,
        !isUuid(rawPayload.ownerUserId),
        "connection_invalid_owner_uuid"
      );
      addReason(
        reasons,
        isUuid(rawPayload.ownerUserId) && !validUserIds.has(rawPayload.ownerUserId),
        "connection_orphan_owner"
      );
      addReason(
        reasons,
        rawPayload.friendUserId !== null && !isUuid(rawPayload.friendUserId),
        "connection_invalid_friend_user_uuid"
      );
      addReason(
        reasons,
        isUuid(rawPayload.friendUserId) && !validUserIds.has(rawPayload.friendUserId),
        "connection_orphan_friend_user"
      );
      addReason(
        reasons,
        typeof rawPayload.friendUserId === "string" &&
          rawPayload.ownerUserId === rawPayload.friendUserId,
        "connection_self_link"
      );
      addReason(
        reasons,
        !isNonEmptyString(rawPayload.inviteCode) ||
          !validInviteCodes.has(rawPayload.inviteCode),
        "connection_invalid_invite"
      );
      addReason(
        reasons,
        typeof rawPayload.inviteCode === "string" &&
          validInviteOwners.has(rawPayload.inviteCode) &&
          validInviteOwners.get(rawPayload.inviteCode) !== rawPayload.ownerUserId,
        "connection_invite_owner_mismatch"
      );
      addReason(
        reasons,
        !isTimestamp(rawPayload.createdAt),
        "connection_invalid_created_at"
      );

      const profile = connectionProfiles[sourceIndex];
      if (!profile) {
        reasons.push("friend_profile_not_object");
      } else {
        reasons.push(...profile.reasons);
        if (!profile.dedupeKey) {
          reasons.push("connection_profile_dedupe_key_unavailable");
        } else if (typeof rawPayload.ownerUserId === "string") {
          const ownerProfileKey = JSON.stringify([
            rawPayload.ownerUserId,
            profile.dedupeKey,
          ]);
          addReason(
            reasons,
            (ownerProfileCounts.get(ownerProfileKey) ?? 0) > 1,
            "connection_duplicate_owner_profile"
          );
        }
      }

      if (
        typeof rawPayload.ownerUserId === "string" &&
        typeof rawPayload.friendUserId === "string"
      ) {
        const pairKey = JSON.stringify(
          [rawPayload.ownerUserId, rawPayload.friendUserId].sort()
        );
        addReason(
          reasons,
          (connectedPairCounts.get(pairKey) ?? 0) > 1,
          "connection_duplicate_linked_pair"
        );
      }
    }

    rawRecords.push({
      sourceFile: connectionsSource.sourceFile,
      sourceIndex,
      recordType: connectionsSource.recordType,
      rawPayload,
      migrationStatus: reasons.length === 0 ? "migrated_candidate" : "needs_review",
      reasons: [...new Set(reasons)],
    });
  });

  return rawRecords;
}

function countStatuses(records: RawRecord[]) {
  return records.reduce(
    (counts, record) => {
      counts[record.migrationStatus] += 1;
      return counts;
    },
    { migrated_candidate: 0, needs_review: 0 }
  );
}

async function main() {
  const sources = await Promise.all(SOURCES.map(loadSource));
  const rawRecords = classifySources(sources);
  const statusCounts = countStatuses(rawRecords);

  if (
    rawRecords.length !== 17 ||
    statusCounts.migrated_candidate !== EXPECTED_MIGRATED_CANDIDATES ||
    statusCounts.needs_review !== EXPECTED_NEEDS_REVIEW
  ) {
    throw new Error(
      "The JSON sources no longer match the reviewed dry-run snapshot. Run the dry-run again before importing."
    );
  }

  const manifestFiles = sources.map((source) => ({
    fileName: source.sourceFile,
    rowCount: source.rows.length,
    checksum: source.checksum,
  }));
  const importFingerprint = `sha256:${sha256(
    JSON.stringify({ version: IMPORT_VERSION, files: manifestFiles })
  )}`;
  const sourceManifest: JsonObject = {
    version: IMPORT_VERSION,
    importFingerprint,
    files: manifestFiles,
  };
  const importSummary: JsonObject = {
    total: rawRecords.length,
    migratedCandidate: statusCounts.migrated_candidate,
    needsReview: statusCounts.needs_review,
  };

  loadEnvConfig(process.cwd(), false);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

  const sql = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    connect_timeout: 15,
    idle_timeout: 5,
  });

  const importRunId = randomUUID();
  const startedAt = new Date().toISOString();

  try {
    await sql.begin(async (transaction) => {
      await transaction`
        SELECT pg_advisory_xact_lock(hashtextextended(${importFingerprint}, 0))
      `;

      const existing = await transaction<{ id: string }[]>`
        SELECT id
        FROM public.migration_import_runs
        WHERE status = 'completed'
          AND source_manifest ->> 'importFingerprint' = ${importFingerprint}
        LIMIT 1
      `;

      if (existing.length > 0) throw new DuplicateImportError();

      await transaction`
        INSERT INTO public.migration_import_runs (
          id,
          source_manifest,
          status,
          started_at,
          completed_at,
          summary
        ) VALUES (
          ${importRunId},
          ${transaction.json(sourceManifest)},
          'in_progress',
          ${startedAt},
          NULL,
          NULL
        )
      `;

      for (const record of rawRecords) {
        await transaction`
          INSERT INTO public.migration_raw_records (
            import_run_id,
            source_file,
            source_index,
            record_type,
            raw_payload,
            migration_status,
            canonical_table,
            canonical_id,
            migration_note
          ) VALUES (
            ${importRunId},
            ${record.sourceFile},
            ${record.sourceIndex},
            ${record.recordType},
            ${transaction.json(record.rawPayload)},
            ${record.migrationStatus},
            NULL,
            NULL,
            ${record.reasons.length > 0 ? record.reasons.join(",") : null}
          )
        `;
      }

      await transaction`
        UPDATE public.migration_import_runs
        SET status = 'completed',
            completed_at = ${new Date().toISOString()},
            summary = ${transaction.json(importSummary)}
        WHERE id = ${importRunId}
      `;
    });

    console.log(
      JSON.stringify({
        success: true,
        importRunId,
        total: rawRecords.length,
        ...statusCounts,
      })
    );
  } catch (error: unknown) {
    if (error instanceof DuplicateImportError) {
      console.log(
        JSON.stringify({
          success: false,
          skipped: true,
          reason: "identical_completed_import_exists",
        })
      );
      return;
    }

    const databaseError = error as { code?: string; name?: string };
    console.error(
      JSON.stringify({
        success: false,
        code: databaseError.code ?? "UNKNOWN",
        type: databaseError.name ?? "Error",
      })
    );
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const safeError = error as { code?: string; name?: string };
  console.error(
    JSON.stringify({
      success: false,
      code: safeError.code ?? "PRE_IMPORT_VALIDATION_FAILED",
      type: safeError.name ?? "Error",
    })
  );
  process.exitCode = 1;
});
