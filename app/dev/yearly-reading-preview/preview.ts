import "server-only";

import { buildMonthlyCompositeFacts } from "../../../lib/yearly/buildMonthlyCompositeFacts";
import { buildMonthlyCompositeSignals } from "../../../lib/yearly/buildMonthlyCompositeSignals";
import { buildMonthlyFortuneCopies } from "../../../lib/yearly/buildMonthlyFortuneCopy";
import { buildYearlyCalculationSnapshot } from "../../../lib/yearly/buildYearlyCalculationSnapshot";
import { buildYearlyCareerCopy } from "../../../lib/yearly/buildYearlyCareerCopy";
import { buildYearlyConditionCopy } from "../../../lib/yearly/buildYearlyConditionCopy";
import { buildYearlyInterpretationFacts } from "../../../lib/yearly/buildYearlyInterpretationFacts";
import { buildYearlyInterpretationSignals } from "../../../lib/yearly/buildYearlyInterpretationSignals";
import { buildYearlyLoveCopy } from "../../../lib/yearly/buildYearlyLoveCopy";
import { buildYearlyMoneyCopy } from "../../../lib/yearly/buildYearlyMoneyCopy";
import { buildYearlyOverallCopy } from "../../../lib/yearly/buildYearlyOverallCopy";
import { buildYearlyMonthlySignals } from "../../../lib/yearly/interpretationRules/monthly";
import type { YearlyCalculationProfile } from "../../../lib/yearly/types";
import type { CareerSituationKey, LoveSituationKey } from "../../../lib/yearlyReadingContext";

export function buildYearlyReadingDevPreview({ profile, targetYear, love, career }: {
  profile: YearlyCalculationProfile;
  targetYear: number;
  love: LoveSituationKey;
  career: CareerSituationKey;
}) {
  const snapshot = buildYearlyCalculationSnapshot({ profile, targetYear });
  const facts = buildYearlyInterpretationFacts({ snapshot });
  const signals = buildYearlyInterpretationSignals(facts);
  const monthly = buildYearlyMonthlySignals(facts.monthly);
  const monthlyCompositeFacts = buildMonthlyCompositeFacts(profile, targetYear);
  const monthlyCompositeSignals = buildMonthlyCompositeSignals(monthlyCompositeFacts);
  const monthlyCopies = buildMonthlyFortuneCopies(monthlyCompositeSignals);

  return {
    targetYear,
    copies: {
      overall: buildYearlyOverallCopy(signals.overall),
      career: buildYearlyCareerCopy({ signals: signals.career, career }),
      money: buildYearlyMoneyCopy(signals.money),
      love: buildYearlyLoveCopy({ signals: signals.love, love }),
      condition: buildYearlyConditionCopy(signals.condition),
    },
    monthlyCopies,
    monthlyCopyDebug: monthlyCompositeSignals.months.map(({ displayMonth, signals: monthSignals }) => ({
      displayMonth,
      signals: monthSignals.map(({ id, source, kind, theme }) => ({ id, source, kind, theme })),
    })),
    monthlyDebug: facts.monthly.map(({ period }, index) => ({
      label: `${period.branch}월`,
      signalCount: monthly.months[index]?.signals.length ?? 0,
    })),
  };
}
