import type { GoldenCase } from "./goldenTypes";
import { validateGoldenCaseDefinition } from "./goldenTypes";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const onlyKeys = (value: Record<string, unknown>, allowed: string[]) => Object.keys(value).every((key) => allowed.includes(key));
const isStringArray = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string");
const strengthLevels = ["very_weak", "weak", "balanced_weak", "balanced", "balanced_strong", "strong", "very_strong"];
const elements = ["wood", "fire", "earth", "metal", "water"];
const geukgukTypes = ["jeonggwan", "pyeongwan", "jeongjae", "pyeonjae", "jeongin", "pyeonin", "siksin", "sanggwan", "geonrok", "yangin", "other"];
const hiddenLayers = ["main", "middle", "residual"];
const pillarPositions = ["year", "month", "day", "hour"];
const isHiddenStem = (value: unknown) => isRecord(value) && onlyKeys(value, ["pillar", "stem", "layer"]) && pillarPositions.includes(String(value.pillar)) && typeof value.stem === "string" && hiddenLayers.includes(String(value.layer));
const isTenGod = (value: unknown) => isRecord(value) && onlyKeys(value, ["pillar", "target", "name"]) && pillarPositions.includes(String(value.pillar)) && ["stem", "branch"].includes(String(value.target)) && typeof value.name === "string";

export interface GoldenImportResult {
  cases: GoldenCase[];
  errors: string[];
}

export function isGoldenCaseSchema(value: unknown): value is GoldenCase {
  if (!isRecord(value) || !onlyKeys(value, ["id", "birth", "expected", "verification", "referenceResults", "notes"])) return false;
  if (typeof value.id !== "string" || !/^GOLDEN-[A-Z0-9_-]+$/i.test(value.id)) return false;
  if (!isRecord(value.birth) || !onlyKeys(value.birth, ["date", "time", "calendar", "gender", "timezone", "locationNote"])) return false;
  if (typeof value.birth.date !== "string" || !["solar", "lunar"].includes(String(value.birth.calendar))) return false;
  if (value.birth.gender !== undefined && !["male", "female"].includes(String(value.birth.gender))) return false;
  if (!isRecord(value.expected) || !onlyKeys(value.expected, ["deterministic", "structural", "interpretive"])) return false;
  if (value.expected.deterministic !== undefined) {
    if (!isRecord(value.expected.deterministic) || !onlyKeys(value.expected.deterministic, ["yearPillar", "monthPillar", "dayPillar", "hourPillar", "hiddenStems", "tenGods", "daeunDirection", "daeunStartAge"])) return false;
    const deterministic = value.expected.deterministic;
    if (["yearPillar", "monthPillar", "dayPillar", "hourPillar"].some((key) => deterministic[key] !== undefined && typeof deterministic[key] !== "string")) return false;
    if (deterministic.hiddenStems !== undefined && (!Array.isArray(deterministic.hiddenStems) || !deterministic.hiddenStems.every(isHiddenStem))) return false;
    if (deterministic.tenGods !== undefined && (!Array.isArray(deterministic.tenGods) || !deterministic.tenGods.every(isTenGod))) return false;
  }
  if (value.expected.structural !== undefined) {
    if (!isRecord(value.expected.structural) || !onlyKeys(value.expected.structural, ["deukryeong", "roots", "exposedStems", "exposures", "relations", "relationDetails", "season"])) return false;
    if (value.expected.structural.deukryeong !== undefined && ![true, false, "uncertain"].includes(value.expected.structural.deukryeong as never)) return false;
    const structural = value.expected.structural;
    if (["roots", "exposedStems", "exposures", "relations", "relationDetails"].some((key) => structural[key] !== undefined && !Array.isArray(structural[key]))) return false;
  }
  if (value.expected.interpretive !== undefined) {
    if (!isRecord(value.expected.interpretive) || !onlyKeys(value.expected.interpretive, ["strength", "geukguk", "johu", "eokbu"])) return false;
    const strength = value.expected.interpretive.strength;
    if (strength !== undefined) {
      if (!isRecord(strength) || !onlyKeys(strength, ["allowedLevels", "consensus", "sourceIds"]) || !Array.isArray(strength.allowedLevels)) return false;
      const allowedLevels = strength.allowedLevels;
      if (!allowedLevels.every((level: unknown) => strengthLevels.includes(String(level))) || (strength.consensus !== undefined && (typeof strength.consensus !== "number" || strength.consensus < 0 || strength.consensus > 1))) return false;
    }
    const geukguk = value.expected.interpretive.geukguk;
    if (geukguk !== undefined) {
      if (!isRecord(geukguk) || !onlyKeys(geukguk, ["acceptedCandidates", "rejectedCandidates", "sourceIds"]) || !Array.isArray(geukguk.acceptedCandidates)) return false;
      if (!geukguk.acceptedCandidates.every((item: unknown) => geukgukTypes.includes(String(item))) || (geukguk.rejectedCandidates !== undefined && (!Array.isArray(geukguk.rejectedCandidates) || !geukguk.rejectedCandidates.every((item: unknown) => geukgukTypes.includes(String(item)))))) return false;
    }
    for (const key of ["johu", "eokbu"] as const) {
      const section = value.expected.interpretive[key];
      if (section !== undefined && (!isRecord(section) || !onlyKeys(section, ["preferredElements", "sourceIds"]) || (section.preferredElements !== undefined && !Array.isArray(section.preferredElements)))) return false;
      if (isRecord(section) && section.preferredElements !== undefined && (!isStringArray(section.preferredElements) || !section.preferredElements.every((element) => elements.includes(element)))) return false;
    }
  }
  if (!isRecord(value.verification) || !onlyKeys(value.verification, ["status", "sources", "notes"])) return false;
  if (!["unverified", "cross_checked", "expert_verified"].includes(String(value.verification.status)) || !Array.isArray(value.verification.sources)) return false;
  for (const source of value.verification.sources) {
    if (!isRecord(source) || !onlyKeys(source, ["id", "type", "name", "reference", "result", "checkedAt", "notes"])) return false;
    if (!["manse_calculator", "book", "expert", "manual_review", "other"].includes(String(source.type)) || typeof source.name !== "string") return false;
  }
  if (value.referenceResults !== undefined) {
    if (!Array.isArray(value.referenceResults)) return false;
    for (const reference of value.referenceResults) {
      if (!isRecord(reference) || !onlyKeys(reference, ["sourceId", "yearPillar", "monthPillar", "dayPillar", "hourPillar", "hiddenStems", "tenGods", "daeunDirection", "daeunStartAge"]) || typeof reference.sourceId !== "string") return false;
      if (reference.hiddenStems !== undefined && (!Array.isArray(reference.hiddenStems) || !reference.hiddenStems.every(isHiddenStem))) return false;
      if (reference.tenGods !== undefined && (!Array.isArray(reference.tenGods) || !reference.tenGods.every(isTenGod))) return false;
    }
  }
  return validateGoldenCaseDefinition(value as unknown as GoldenCase).valid;
}

export function parseGoldenCaseJson(json: string): GoldenImportResult {
  try {
    const parsed: unknown = JSON.parse(json);
    const values = Array.isArray(parsed) ? parsed : [parsed];
    const cases: GoldenCase[] = [];
    const errors: string[] = [];
    values.forEach((value, index) => {
      if (isGoldenCaseSchema(value)) cases.push(value);
      else errors.push(`항목 ${index + 1}: GoldenCase schema와 맞지 않습니다.`);
    });
    return { cases, errors };
  } catch {
    return { cases: [], errors: ["유효한 JSON 파일이 아닙니다."] };
  }
}

export function serializeGoldenCase(goldenCase: GoldenCase) {
  if (!isGoldenCaseSchema(goldenCase)) throw new Error("GoldenCase 검증에 실패했습니다.");
  return JSON.stringify(goldenCase, null, 2);
}

export function buildGoldenCasesTsSnippet(cases: GoldenCase[]) {
  if (!cases.length || cases.some((item) => !isGoldenCaseSchema(item))) throw new Error("내보낼 GoldenCase가 유효하지 않습니다.");
  return `import type { GoldenCase } from "../../lib/myeongri/goldenTypes";\n\nexport const GOLDEN_CASES: GoldenCase[] = ${JSON.stringify(cases, null, 2)};\n`;
}

export function findSourceIndependenceWarnings(goldenCase: GoldenCase) {
  const warnings: string[] = [];
  const sources = goldenCase.verification.sources;
  for (let left = 0; left < sources.length; left += 1) for (let right = left + 1; right < sources.length; right += 1) {
    const sameName = sources[left].name.trim().toLowerCase() === sources[right].name.trim().toLowerCase();
    const sameReference = Boolean(sources[left].reference && sources[left].reference === sources[right].reference);
    if (sameName || sameReference) warnings.push(`${sources[left].name || `출처 ${left + 1}`}와 ${sources[right].name || `출처 ${right + 1}`}: 독립적인 교차검증 출처인지 확인하세요.`);
  }
  return warnings;
}

export function compareReferencePillars(goldenCase: GoldenCase) {
  const results = goldenCase.referenceResults ?? [];
  const fields = ["yearPillar", "monthPillar", "dayPillar", "hourPillar", "hiddenStems", "tenGods", "daeunDirection", "daeunStartAge"] as const;
  return fields.map((field) => {
    const values = results.map((item) => ({ sourceId: item.sourceId, rawValue: item[field], value: typeof item[field] === "object" ? JSON.stringify(item[field]) : String(item[field] ?? "") })).filter((item) => item.rawValue !== undefined && item.value !== "");
    return { field, values, agreement: values.length >= 2 && new Set(values.map((item) => item.value)).size === 1, disagreement: values.length >= 2 && new Set(values.map((item) => item.value)).size > 1 };
  });
}
