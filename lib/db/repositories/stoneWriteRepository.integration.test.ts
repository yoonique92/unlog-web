import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import { closePostgresClient, getPostgresClient } from "../postgres";
import {
  grantStones,
  StoneWriteRepositoryError,
  unlockContentWithStones,
} from "./stoneWriteRepository";

const describeDatabase =
  process.env.RUN_STONE_DB_INTEGRATION === "true" ? describe : describe.skip;

describeDatabase("stoneWriteRepository PostgreSQL integration", () => {
  afterAll(async () => {
    await closePostgresClient();
  });

  it("calls the installed stone functions and removes all test data", async () => {
    const sql = getPostgresClient();
    const testUserId = randomUUID();
    const idempotencyPrefix = `stone-repository-test:${randomUUID()}`;

    const [countsBefore] = await sql<
      Array<{ users: number; wallets: number; ledgers: number; unlocks: number }>
    >`
      SELECT
        (SELECT count(*)::integer FROM public.users) AS users,
        (SELECT count(*)::integer FROM public.user_stone_wallets) AS wallets,
        (SELECT count(*)::integer FROM public.stone_ledger_entries) AS ledgers,
        (SELECT count(*)::integer FROM public.content_unlocks) AS unlocks
    `;

    try {
      await sql`
        INSERT INTO public.users (id, display_name, created_at, updated_at)
        VALUES (
          ${testUserId}::uuid,
          ${"stone-repository-integration-test"},
          pg_catalog.clock_timestamp(),
          NULL
        )
      `;

      const granted = await grantStones({
        userId: testUserId,
        amount: 2,
        entryType: "integration_test_grant",
        idempotencyKey: `${idempotencyPrefix}:grant`,
        requestFingerprint: `${idempotencyPrefix}:grant:v1`,
        metadata: { test: true },
      });
      expect(granted).toMatchObject({ walletBalance: 2, created: true });

      const grantRetry = await grantStones({
        userId: testUserId,
        amount: 2,
        entryType: "integration_test_grant",
        idempotencyKey: `${idempotencyPrefix}:grant`,
        requestFingerprint: `${idempotencyPrefix}:grant:v1`,
        metadata: { test: true },
      });
      expect(grantRetry).toEqual({ ...granted, created: false });

      const unlocked = await unlockContentWithStones({
        userId: testUserId,
        contentType: "yearly_fortune",
        contentKey: "integration-test-2027",
        costStones: 1,
        idempotencyKey: `${idempotencyPrefix}:unlock`,
        requestFingerprint: `${idempotencyPrefix}:unlock:v1`,
        metadata: { test: true },
      });
      expect(unlocked).toMatchObject({ walletBalance: 1, created: true });

      await expect(
        unlockContentWithStones({
          userId: testUserId,
          contentType: "compatibility",
          contentKey: "profile:v1:integration-test",
          costStones: 2,
          idempotencyKey: `${idempotencyPrefix}:insufficient`,
          requestFingerprint: `${idempotencyPrefix}:insufficient:v1`,
        })
      ).rejects.toEqual(
        expect.objectContaining<Partial<StoneWriteRepositoryError>>({
          name: "StoneWriteRepositoryError",
          code: "INSUFFICIENT_STONES",
        })
      );

      const [state] = await sql<
        Array<{ balance: number; ledgers: number; unlocks: number }>
      >`
        SELECT
          (SELECT balance FROM public.user_stone_wallets WHERE user_id = ${testUserId}::uuid) AS balance,
          (SELECT count(*)::integer FROM public.stone_ledger_entries WHERE user_id = ${testUserId}::uuid) AS ledgers,
          (SELECT count(*)::integer FROM public.content_unlocks WHERE user_id = ${testUserId}::uuid) AS unlocks
      `;
      expect(state).toEqual({ balance: 1, ledgers: 2, unlocks: 1 });
    } finally {
      await sql.begin(async (transaction) => {
        await transaction`
          DELETE FROM public.content_unlocks
          WHERE user_id = ${testUserId}::uuid
        `;
        await transaction`
          DELETE FROM public.stone_ledger_entries
          WHERE user_id = ${testUserId}::uuid
        `;
        await transaction`
          DELETE FROM public.user_stone_wallets
          WHERE user_id = ${testUserId}::uuid
        `;
        await transaction`
          DELETE FROM public.users
          WHERE id = ${testUserId}::uuid
        `;
      });
    }

    const [countsAfter] = await sql<
      Array<{ users: number; wallets: number; ledgers: number; unlocks: number }>
    >`
      SELECT
        (SELECT count(*)::integer FROM public.users) AS users,
        (SELECT count(*)::integer FROM public.user_stone_wallets) AS wallets,
        (SELECT count(*)::integer FROM public.stone_ledger_entries) AS ledgers,
        (SELECT count(*)::integer FROM public.content_unlocks) AS unlocks
    `;
    expect(countsAfter).toEqual(countsBefore);
  });
});
