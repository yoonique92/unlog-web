import type { getSaju } from "../saju";
import { buildDayMasterCopy } from "./buildDayMasterCopy";
import { buildFiveElementsCopy } from "./buildFiveElementsCopy";
import { buildSajuReadingFacts } from "./buildSajuReadingFacts";
import { buildTenGodCopies } from "./buildTenGodCopy";
import type { SajuReadingDocument } from "./types";

type CanonicalSajuResult = ReturnType<typeof getSaju>;

export function buildSajuReading(
  saju: CanonicalSajuResult,
): SajuReadingDocument {
  const facts = buildSajuReadingFacts(saju);
  return {
    facts,
    dayMaster: buildDayMasterCopy(facts),
    fiveElements: buildFiveElementsCopy(facts),
    tenGods: buildTenGodCopies(facts),
  };
}

export * from "./types";
export { buildSajuReadingFacts } from "./buildSajuReadingFacts";
export { buildDayMasterCopy } from "./buildDayMasterCopy";
export { buildFiveElementsCopy } from "./buildFiveElementsCopy";
export { buildTenGodCopies } from "./buildTenGodCopy";
