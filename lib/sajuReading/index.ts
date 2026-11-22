import { buildDayMasterCopy } from "./buildDayMasterCopy";
import { buildFiveElementsCopy } from "./buildFiveElementsCopy";
import { buildSajuReadingFacts } from "./buildSajuReadingFacts";
import { buildTenGodCopies } from "./buildTenGodCopy";
import type { SajuReadingDocument, SajuReadingSource } from "./types";

export function buildSajuReading(
  saju: SajuReadingSource,
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
