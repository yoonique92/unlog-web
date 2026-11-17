import "server-only";

import { findSajuProfileByUserId } from "../db/repositories/userRepository";
import { findStoneContentStateForUser } from "../db/repositories/stoneReadRepository";
import { getSaju } from "../saju";
import {
  getYearlyInterpretation,
  type YearlyInterpretation,
} from "../yearlyInterpretation";
import { resolveStoneContentPolicy } from "./stoneContentPolicy";

export type YearlyFortuneReadResult =
  | {
      found: false;
    }
  | {
      found: true;
      profileReady: false;
    }
  | {
      found: true;
      profileReady: true;
      walletBalance: number;
      unlocked: boolean;
      unlockId: string | null;
      interpretation: YearlyInterpretation | null;
    };

/**
 * Returns paid yearly interpretation data only after the canonical entitlement
 * has been verified. Profile data and intermediate saju calculation results do
 * not cross this server-only boundary.
 */
export async function getYearlyFortuneForUser(
  userId: string,
  year: number
): Promise<YearlyFortuneReadResult> {
  const policy = resolveStoneContentPolicy({ kind: "yearlyFortune", year });
  if (!policy) return { found: true, profileReady: false };

  const [profile, stoneState] = await Promise.all([
    findSajuProfileByUserId(userId),
    findStoneContentStateForUser(userId, {
      contentType: policy.contentType,
      contentKey: policy.contentKey,
    }),
  ]);

  if (!stoneState) return { found: false };
  if (!profile) return { found: true, profileReady: false };

  let yearlyInput: Parameters<typeof getYearlyInterpretation>[0];
  try {
    const saju = getSaju(
      profile.birthDate,
      String(profile.birthHour),
      String(profile.birthMinute),
      profile.calendarType,
      profile.gender,
      profile.birthTimeUnknown
    );
    const yearlyFlow = saju.normalizedSaju.seyun.find(
      (period) => period.year === year
    );
    if (!yearlyFlow) return { found: true, profileReady: false };

    const currentDaeun = saju.normalizedSaju.currentDaeun;
    yearlyInput = {
      dayStem: saju.dayStem,
      yearGanzhi: yearlyFlow.ganzhi,
      yearStemTenGod: yearlyFlow.stemTenGod,
      yearBranchTenGod: yearlyFlow.branchTenGod,
      currentDaeunGanzhi: currentDaeun?.ganzhi ?? "",
      currentDaeunStemTenGod: currentDaeun?.stemTenGod ?? "",
      currentDaeunBranchTenGod: currentDaeun?.branchTenGod ?? "",
    };
  } catch {
    return { found: true, profileReady: false };
  }

  if (!stoneState.unlocked) {
    return {
      found: true,
      profileReady: true,
      ...stoneState,
      interpretation: null,
    };
  }

  return {
    found: true,
    profileReady: true,
    ...stoneState,
    interpretation: getYearlyInterpretation(yearlyInput),
  };
}
