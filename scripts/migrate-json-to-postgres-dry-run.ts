import { readFile } from "node:fs/promises";
import path from "node:path";

type JsonRecord = Record<string, unknown>;
type RawStatus = "migrated_candidate" | "needs_review";

type RowAnalysis = {
  sourceIndex: number;
  status: RawStatus;
  reasons: string[];
};

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const ALLOWED_PROVIDERS = new Set(["kakao", "naver", "google"]);
const ALLOWED_CALENDAR_TYPES = new Set(["solar", "lunar"]);
const ALLOWED_GENDERS = new Set(["male", "female"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function isDate(value: unknown): value is string {
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
  value: unknown,
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

function countReasons(rows: RowAnalysis[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    for (const reason of row.reasons) {
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }

  return Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
}

function countStatuses(rows: RowAnalysis[]) {
  return rows.reduce(
    (counts, row) => {
      counts[row.status] += 1;
      return counts;
    },
    { migrated_candidate: 0, needs_review: 0 }
  );
}

async function readJsonArray(fileName: string): Promise<unknown[]> {
  const filePath = path.join(DATA_DIRECTORY, fileName);
  const parsed: unknown = JSON.parse(await readFile(filePath, "utf8"));

  if (!Array.isArray(parsed)) {
    throw new Error(`${fileName}: root value is not an array`);
  }

  return parsed;
}

function profileDedupeKey(profile: JsonRecord) {
  return (
    "v1:" +
    JSON.stringify([profile.name, profile.birthDate, profile.gender])
  );
}

function analyzeSajuProfile(profile: unknown) {
  const reasons: string[] = [];

  if (!isRecord(profile)) {
    return { candidate: false, reasons: ["saju_profile_not_object"] };
  }

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

  return { candidate: reasons.length === 0, reasons };
}

function analyzeFriendProfile(profile: unknown) {
  const reasons: string[] = [];
  const fallbackFields: string[] = [];

  if (!isRecord(profile)) {
    return {
      candidate: false,
      reasons: ["friend_profile_not_object"],
      fallbackFields,
      dedupeKey: null,
    };
  }

  for (const field of [
    "name",
    "birthDate",
    "gender",
    "dayPillar",
    "characterName",
    "image",
  ] as const) {
    addReason(
      reasons,
      !isNonEmptyString(profile[field]),
      `friend_profile_invalid_${field}`
    );
  }

  for (const field of ["birthHour", "birthMinute"] as const) {
    if (profile[field] === undefined || profile[field] === null) {
      fallbackFields.push(field);
    } else {
      addReason(
        reasons,
        typeof profile[field] !== "string",
        `friend_profile_invalid_${field}`
      );
    }
  }

  if (profile.birthTimeUnknown === undefined || profile.birthTimeUnknown === null) {
    fallbackFields.push("birthTimeUnknown");
  } else {
    addReason(
      reasons,
      typeof profile.birthTimeUnknown !== "boolean",
      "friend_profile_invalid_birthTimeUnknown"
    );
  }

  if (profile.calendarType === undefined || profile.calendarType === null) {
    fallbackFields.push("calendarType");
  } else {
    addReason(
      reasons,
      typeof profile.calendarType !== "string" ||
        !ALLOWED_CALENDAR_TYPES.has(profile.calendarType),
      "friend_profile_invalid_calendarType"
    );
  }

  const dedupeKey =
    typeof profile.name === "string" &&
    typeof profile.birthDate === "string" &&
    typeof profile.gender === "string"
      ? profileDedupeKey(profile)
      : null;

  return {
    candidate: reasons.length === 0,
    reasons,
    fallbackFields,
    dedupeKey,
  };
}

async function main() {
  const [usersSource, invitesSource, connectionsSource] = await Promise.all([
    readJsonArray("users.json"),
    readJsonArray("friend-invites.json"),
    readJsonArray("friend-connections.json"),
  ]);

  const duplicateUserIds = new Set<string>();
  const duplicateIdentityKeys = new Set<string>();
  const userIdCounts = new Map<string, number>();
  const identityKeyCounts = new Map<string, number>();

  for (const value of usersSource) {
    if (!isRecord(value)) continue;
    if (typeof value.id === "string") {
      userIdCounts.set(value.id, (userIdCounts.get(value.id) ?? 0) + 1);
    }
    if (typeof value.provider === "string" && typeof value.providerUserId === "string") {
      const identityKey = JSON.stringify([value.provider, value.providerUserId]);
      identityKeyCounts.set(
        identityKey,
        (identityKeyCounts.get(identityKey) ?? 0) + 1
      );
    }
  }

  for (const [id, count] of userIdCounts) {
    if (count > 1) duplicateUserIds.add(id);
  }
  for (const [key, count] of identityKeyCounts) {
    if (count > 1) duplicateIdentityKeys.add(key);
  }

  const userRows: RowAnalysis[] = [];
  const validUserIds = new Set<string>();
  let usersTableCandidates = 0;
  let authIdentityCandidates = 0;
  let sajuProfilesPresent = 0;
  let sajuProfileCandidates = 0;

  usersSource.forEach((value, sourceIndex) => {
    const reasons: string[] = [];

    if (!isRecord(value)) {
      userRows.push({
        sourceIndex,
        status: "needs_review",
        reasons: ["user_not_object"],
      });
      return;
    }

    const userReasons: string[] = [];
    addReason(userReasons, !isUuid(value.id), "user_invalid_uuid");
    addReason(
      userReasons,
      typeof value.name !== "string",
      "user_invalid_display_name"
    );
    addReason(
      userReasons,
      !isTimestamp(value.createdAt),
      "user_invalid_created_at"
    );
    addReason(
      userReasons,
      typeof value.id === "string" && duplicateUserIds.has(value.id),
      "user_duplicate_id"
    );

    const userCandidate = userReasons.length === 0;
    if (userCandidate) {
      usersTableCandidates += 1;
      validUserIds.add(value.id as string);
    }
    reasons.push(...userReasons);

    const providerAllowed =
      typeof value.provider === "string" &&
      ALLOWED_PROVIDERS.has(value.provider);
    const providerUserIdValid = isNonEmptyString(value.providerUserId);
    const identityKey =
      typeof value.provider === "string" &&
      typeof value.providerUserId === "string"
        ? JSON.stringify([value.provider, value.providerUserId])
        : null;
    const identityReasons: string[] = [];
    addReason(
      identityReasons,
      !providerAllowed,
      "auth_identity_invalid_provider"
    );
    addReason(
      identityReasons,
      !providerUserIdValid,
      "auth_identity_missing_provider_user_id"
    );
    addReason(
      identityReasons,
      identityKey !== null && duplicateIdentityKeys.has(identityKey),
      "auth_identity_duplicate_provider_user_id"
    );
    addReason(
      identityReasons,
      !userCandidate,
      "auth_identity_invalid_user_reference"
    );
    if (identityReasons.length === 0) authIdentityCandidates += 1;
    reasons.push(...identityReasons);

    if (value.sajuProfile !== undefined && value.sajuProfile !== null) {
      sajuProfilesPresent += 1;
      const profile = analyzeSajuProfile(value.sajuProfile);
      if (profile.candidate && userCandidate) {
        sajuProfileCandidates += 1;
      } else {
        reasons.push(...profile.reasons);
        if (!userCandidate) reasons.push("saju_profile_invalid_user_reference");
      }
    }

    userRows.push({
      sourceIndex,
      status: reasons.length === 0 ? "migrated_candidate" : "needs_review",
      reasons: [...new Set(reasons)],
    });
  });

  const inviteCodeCounts = new Map<string, number>();
  const ownerFirstIndex = new Map<string, number>();
  const ownerIndexes = new Map<string, number[]>();

  invitesSource.forEach((value, sourceIndex) => {
    if (!isRecord(value)) return;

    if (typeof value.code === "string") {
      inviteCodeCounts.set(value.code, (inviteCodeCounts.get(value.code) ?? 0) + 1);
    }
    if (typeof value.ownerId === "string") {
      if (!ownerFirstIndex.has(value.ownerId)) {
        ownerFirstIndex.set(value.ownerId, sourceIndex);
      }
      const indexes = ownerIndexes.get(value.ownerId) ?? [];
      indexes.push(sourceIndex);
      ownerIndexes.set(value.ownerId, indexes);
    }
  });

  const inviteRows: RowAnalysis[] = [];
  const operationalInviteCodes = new Set<string>();
  const operationalInviteOwners = new Map<string, string>();
  let validOwnerInvites = 0;
  let orphanInvites = 0;
  let legacyFriendObjects = 0;
  let activeInviteCandidates = 0;
  let inactiveInviteCandidates = 0;
  let operationalInviteCandidates = 0;

  invitesSource.forEach((value, sourceIndex) => {
    const reasons: string[] = [];

    if (!isRecord(value)) {
      inviteRows.push({
        sourceIndex,
        status: "needs_review",
        reasons: ["invite_not_object"],
      });
      return;
    }

    const ownerExists = isUuid(value.ownerId) && validUserIds.has(value.ownerId);
    if (ownerExists) validOwnerInvites += 1;
    if (!ownerExists) {
      orphanInvites += 1;
      reasons.push("invite_orphan_owner");
    }

    addReason(reasons, !isNonEmptyString(value.code), "invite_invalid_code");
    addReason(reasons, !isUuid(value.ownerId), "invite_invalid_owner_uuid");
    addReason(
      reasons,
      typeof value.code === "string" &&
        (inviteCodeCounts.get(value.code) ?? 0) > 1,
      "invite_duplicate_code"
    );
    addReason(
      reasons,
      !isTimestamp(value.createdAt),
      "invite_invalid_created_at"
    );

    const hasLegacyFriend = value.friend !== undefined;
    if (hasLegacyFriend) {
      legacyFriendObjects += 1;
      reasons.push("invite_legacy_friend_requires_review");
    }

    const isFirstForOwner =
      typeof value.ownerId === "string" &&
      ownerFirstIndex.get(value.ownerId) === sourceIndex;
    const structuralReasons = reasons.filter(
      (reason) => reason !== "invite_legacy_friend_requires_review"
    );
    const operationalCandidate = ownerExists && structuralReasons.length === 0;
    if (operationalCandidate) {
      operationalInviteCandidates += 1;
      if (isFirstForOwner) activeInviteCandidates += 1;
      else inactiveInviteCandidates += 1;
      operationalInviteCodes.add(value.code as string);
      operationalInviteOwners.set(value.code as string, value.ownerId as string);
    }

    inviteRows.push({
      sourceIndex,
      status: reasons.length === 0 ? "migrated_candidate" : "needs_review",
      reasons: [...new Set(reasons)],
    });
  });

  const duplicateConnectionIds = new Set<string>();
  const connectionIdCounts = new Map<string, number>();
  const connectionProvisional = connectionsSource.map((value, sourceIndex) => {
    if (!isRecord(value)) {
      return {
        sourceIndex,
        record: null,
        baseReasons: ["connection_not_object"],
        fallbackFields: [] as string[],
        dedupeKey: null,
      };
    }

    if (typeof value.id === "string") {
      connectionIdCounts.set(
        value.id,
        (connectionIdCounts.get(value.id) ?? 0) + 1
      );
    }

    const profile = analyzeFriendProfile(value.friendProfile);
    return {
      sourceIndex,
      record: value,
      baseReasons: [...profile.reasons],
      fallbackFields: profile.fallbackFields,
      dedupeKey: profile.dedupeKey,
    };
  });

  for (const [id, count] of connectionIdCounts) {
    if (count > 1) duplicateConnectionIds.add(id);
  }

  const ownerDedupeCounts = new Map<string, number>();
  const connectedPairCounts = new Map<string, number>();

  for (const item of connectionProvisional) {
    if (!item.record) continue;
    if (typeof item.record.ownerUserId === "string" && item.dedupeKey !== null) {
      const key = JSON.stringify([item.record.ownerUserId, item.dedupeKey]);
      ownerDedupeCounts.set(key, (ownerDedupeCounts.get(key) ?? 0) + 1);
    }
    if (
      typeof item.record.ownerUserId === "string" &&
      typeof item.record.friendUserId === "string"
    ) {
      const pair = [item.record.ownerUserId, item.record.friendUserId].sort();
      const key = JSON.stringify(pair);
      connectedPairCounts.set(key, (connectedPairCounts.get(key) ?? 0) + 1);
    }
  }

  const connectionRows: RowAnalysis[] = [];
  const fallbackUsageCounts = new Map<string, number>();
  let connectionCandidates = 0;
  let profileDedupeKeysGenerated = 0;

  for (const item of connectionProvisional) {
    const reasons = [...item.baseReasons];
    const value = item.record;

    if (!value) {
      connectionRows.push({
        sourceIndex: item.sourceIndex,
        status: "needs_review",
        reasons,
      });
      continue;
    }

    addReason(reasons, !isUuid(value.id), "connection_invalid_uuid");
    addReason(
      reasons,
      typeof value.id === "string" && duplicateConnectionIds.has(value.id),
      "connection_duplicate_id"
    );
    addReason(
      reasons,
      !isUuid(value.ownerUserId),
      "connection_invalid_owner_uuid"
    );
    addReason(
      reasons,
      isUuid(value.ownerUserId) && !validUserIds.has(value.ownerUserId),
      "connection_orphan_owner"
    );

    const friendUserValid =
      value.friendUserId === null ||
      (isUuid(value.friendUserId) && validUserIds.has(value.friendUserId));
    addReason(
      reasons,
      value.friendUserId !== null && !isUuid(value.friendUserId),
      "connection_invalid_friend_user_uuid"
    );
    addReason(
      reasons,
      isUuid(value.friendUserId) && !validUserIds.has(value.friendUserId),
      "connection_orphan_friend_user"
    );
    addReason(
      reasons,
      friendUserValid &&
        typeof value.friendUserId === "string" &&
        value.ownerUserId === value.friendUserId,
      "connection_self_link"
    );

    addReason(
      reasons,
      !isNonEmptyString(value.inviteCode) ||
        !operationalInviteCodes.has(value.inviteCode),
      "connection_invalid_invite"
    );
    addReason(
      reasons,
      isNonEmptyString(value.inviteCode) &&
        operationalInviteOwners.has(value.inviteCode) &&
        operationalInviteOwners.get(value.inviteCode) !== value.ownerUserId,
      "connection_invite_owner_mismatch"
    );
    addReason(
      reasons,
      !isTimestamp(value.createdAt),
      "connection_invalid_created_at"
    );

    if (item.dedupeKey !== null) {
      profileDedupeKeysGenerated += 1;
      if (typeof value.ownerUserId === "string") {
        const ownerDedupeKey = JSON.stringify([
          value.ownerUserId,
          item.dedupeKey,
        ]);
        addReason(
          reasons,
          (ownerDedupeCounts.get(ownerDedupeKey) ?? 0) > 1,
          "connection_duplicate_owner_profile"
        );
      }
    } else {
      reasons.push("connection_profile_dedupe_key_unavailable");
    }

    if (
      typeof value.ownerUserId === "string" &&
      typeof value.friendUserId === "string"
    ) {
      const pairKey = JSON.stringify(
        [value.ownerUserId, value.friendUserId].sort()
      );
      addReason(
        reasons,
        (connectedPairCounts.get(pairKey) ?? 0) > 1,
        "connection_duplicate_linked_pair"
      );
    }

    for (const field of item.fallbackFields) {
      fallbackUsageCounts.set(field, (fallbackUsageCounts.get(field) ?? 0) + 1);
    }

    const uniqueReasons = [...new Set(reasons)];
    if (uniqueReasons.length === 0) connectionCandidates += 1;
    connectionRows.push({
      sourceIndex: item.sourceIndex,
      status:
        uniqueReasons.length === 0 ? "migrated_candidate" : "needs_review",
      reasons: uniqueReasons,
    });
  }

  const multipleInviteOwners = [...ownerIndexes.values()].filter(
    (indexes) => indexes.length > 1
  );
  const allRows = [...userRows, ...inviteRows, ...connectionRows];

  const output = {
    dryRun: true,
    databaseAccess: false,
    sourceFilesModified: false,
    users: {
      total: usersSource.length,
      usersTableCandidates,
      authIdentityCandidates,
      sajuProfilesPresent,
      sajuProfileCandidates,
      ...countStatuses(userRows),
      issueCounts: countReasons(userRows),
      reviewRows: userRows.filter((row) => row.status === "needs_review"),
    },
    invites: {
      total: invitesSource.length,
      validOwnerInvites,
      orphanInvites,
      operationalInviteCandidates,
      multipleOwnerCount: multipleInviteOwners.length,
      multipleOwnerInviteCounts: multipleInviteOwners
        .map((indexes) => indexes.length)
        .sort((a, b) => a - b),
      activeInviteCandidates,
      inactiveInviteCandidates,
      legacyFriendObjects,
      ...countStatuses(inviteRows),
      issueCounts: countReasons(inviteRows),
      reviewRows: inviteRows.filter((row) => row.status === "needs_review"),
    },
    connections: {
      total: connectionsSource.length,
      operationalCandidates: connectionCandidates,
      profileDedupeKeysGenerated,
      fallbackUsage: Object.fromEntries(
        [...fallbackUsageCounts].sort(([a], [b]) => a.localeCompare(b))
      ),
      ...countStatuses(connectionRows),
      issueCounts: countReasons(connectionRows),
      reviewRows: connectionRows.filter((row) => row.status === "needs_review"),
    },
    rawMigration: {
      total: allRows.length,
      ...countStatuses(allRows),
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown dry-run error";
  console.error(JSON.stringify({ dryRun: true, databaseAccess: false, error: message }));
  process.exitCode = 1;
});
