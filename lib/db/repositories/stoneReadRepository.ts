import "server-only";

import type { ResolvedStoneContentPolicy } from "../../stones/stoneContentPolicy";
import { getPostgresClient } from "../postgres";

export type StoneContentIdentity = Pick<
  ResolvedStoneContentPolicy,
  "contentType" | "contentKey"
>;

export type StoneContentReadState = {
  walletBalance: number;
  unlocked: boolean;
  unlockId: string | null;
};

type StoneWalletBalanceRow = {
  wallet_balance: number;
};

type StoneContentReadStateRow = {
  wallet_balance: number;
  unlock_id: string | null;
};

/**
 * Reads the canonical wallet balance without creating a wallet. A missing
 * wallet is balance zero, while null means the canonical user does not exist.
 */
export async function findStoneWalletBalanceForUser(
  userId: string
): Promise<number | null> {
  const sql = getPostgresClient();
  const rows = await sql<StoneWalletBalanceRow[]>`
    SELECT COALESCE(usw.balance, 0)::integer AS wallet_balance
    FROM public.users u
    LEFT JOIN public.user_stone_wallets usw
      ON usw.user_id = u.id
    WHERE u.id = ${userId}::uuid
    LIMIT 1
  `;

  return rows[0]?.wallet_balance ?? null;
}

/**
 * Reads wallet and entitlement state without creating a wallet or mutating any
 * stone data. A null result means the canonical user does not exist.
 */
export async function findStoneContentStateForUser(
  userId: string,
  content: StoneContentIdentity
): Promise<StoneContentReadState | null> {
  const sql = getPostgresClient();
  const rows = await sql<StoneContentReadStateRow[]>`
    SELECT
      COALESCE(usw.balance, 0)::integer AS wallet_balance,
      cu.id::text AS unlock_id
    FROM public.users u
    LEFT JOIN public.user_stone_wallets usw
      ON usw.user_id = u.id
    LEFT JOIN public.content_unlocks cu
      ON cu.user_id = u.id
     AND cu.content_type = ${content.contentType}
     AND cu.content_key = ${content.contentKey}
    WHERE u.id = ${userId}::uuid
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;
  return {
    walletBalance: row.wallet_balance,
    unlocked: row.unlock_id !== null,
    unlockId: row.unlock_id,
  };
}
