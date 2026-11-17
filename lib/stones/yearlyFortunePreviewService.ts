import "server-only";

import { findSajuProfileByUserId } from "../db/repositories/userRepository";
import { getSaju } from "../saju";
import { getYearlyInterpretation } from "../yearlyInterpretation";

export type YearlyFortunePreviewResult =
  | { profileReady: false }
  | { profileReady: true; preview: { year: number; text: string } };

export async function getYearlyFortunePreviewForUser(
  userId: string,
  year: number
): Promise<YearlyFortunePreviewResult> {
  const profile = await findSajuProfileByUserId(userId);
  if (!profile) return { profileReady: false };

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
    if (!yearlyFlow) return { profileReady: false };

    const currentDaeun = saju.normalizedSaju.currentDaeun;
    const interpretation = getYearlyInterpretation({
      dayStem: saju.dayStem,
      yearGanzhi: yearlyFlow.ganzhi,
      yearStemTenGod: yearlyFlow.stemTenGod,
      yearBranchTenGod: yearlyFlow.branchTenGod,
      currentDaeunGanzhi: currentDaeun?.ganzhi ?? "",
      currentDaeunStemTenGod: currentDaeun?.stemTenGod ?? "",
      currentDaeunBranchTenGod: currentDaeun?.branchTenGod ?? "",
    });

    return {
      profileReady: true,
      preview: {
        year,
        text: `${interpretation.headline}예요. ${interpretation.summary}`,
      },
    };
  } catch {
    return { profileReady: false };
  }
}
