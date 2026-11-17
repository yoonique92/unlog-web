import { buildOverallSignals } from "./interpretationRules/overall";
import { buildCareerSignals } from "./interpretationRules/career";
import { buildMoneySignals } from "./interpretationRules/money";
import { buildLoveSignals } from "./interpretationRules/love";
import { buildConditionSignals } from "./interpretationRules/condition";
import type {
  YearlyInterpretationFacts,
  YearlyInterpretationSignals,
} from "./types";

export const YEARLY_INTERPRETATION_RULES_VERSION = "yearly-rules-v1" as const;

export function buildYearlyInterpretationSignals(
  facts: YearlyInterpretationFacts,
): YearlyInterpretationSignals {
  return {
    version: YEARLY_INTERPRETATION_RULES_VERSION,
    overall: buildOverallSignals(facts),
    career: buildCareerSignals(facts),
    money: buildMoneySignals(facts),
    love: buildLoveSignals(facts),
    condition: buildConditionSignals(facts),
  };
}
