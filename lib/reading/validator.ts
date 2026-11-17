import type { ReadingContext, ReadingValidationResult, StructuredReadingResponse, ValidationIssue } from "./types";
import {
  UNLOG_DETERMINISTIC_EVENT_PATTERN,
  UNLOG_MEDICAL_CERTAINTY_PATTERN,
  UNLOG_OVERCERTAIN_EXPRESSIONS,
} from "../saju/interpretationTone";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const TEN_GODS = ["비견", "겁재", "식신", "상관", "정재", "편재", "정관", "편관", "칠살", "정인", "편인"];
const GEUKGUK_TERMS = ["정관격", "편관격", "재격", "인수격", "식상격", "비겁격", "종왕격", "종약격"];
const YONGSIN_PATTERN = /용신(?:은|이|으로|:)?\s*[木火土金水목화토금수]/;
const SINSAL_TERMS = ["도화살", "역마살", "화개살", "백호살", "괴강살", "양인살"];
const FINAL_GEUKGUK_PATTERN = /(?:당신은\s*)?[가-힣]+격(?:입니다|이다|이에요|으로 확정)/;
const FINAL_YONGSIN_PATTERN = /(?:당신의\s*)?용신(?:은|이|:)?\s*[木火土金水목화토금수](?:입니다|이다|이에요)?/;

function mentioned(text: string, terms: string[]) {
  return terms.filter((term) => text.includes(term));
}

export function validateReadingResponse(response: StructuredReadingResponse, context: ReadingContext): ReadingValidationResult {
  const issues: ValidationIssue[] = [];
  const validFindingIds = new Set([...context.topNatalFindings, ...context.timelineFindings].map((item) => item.id));
  const allowedSymbols = new Set(Object.values(context.profile.pillars).filter(Boolean).join("").split(""));
  if (context.profile.daeunGanzhi) for (const symbol of context.profile.daeunGanzhi) allowedSymbols.add(symbol);
  if (context.profile.targetSeyunGanzhi) for (const symbol of context.profile.targetSeyunGanzhi) allowedSymbols.add(symbol);

  response.sections.forEach((section, sectionIndex) => {
    const text = `${section.title} ${section.body}`;
    if (!validFindingIds.has(section.findingId)) issues.push({ code: "UNKNOWN_FINDING", message: `전달되지 않은 findingId입니다: ${section.findingId}`, sectionIndex });
    const unknownSymbols = mentioned(text, [...STEMS, ...BRANCHES]).filter((symbol) => !allowedSymbols.has(symbol));
    if (unknownSymbols.length) issues.push({ code: "UNKNOWN_STEM_BRANCH", message: `제공되지 않은 천간/지지: ${unknownSymbols.join(", ")}`, sectionIndex });
    const unknownTenGods = mentioned(text, TEN_GODS).filter((name) => !context.profile.tenGods.some((provided) => provided.includes(name)));
    if (unknownTenGods.length) issues.push({ code: "UNKNOWN_TEN_GOD", message: `계산값에 없는 십성: ${unknownTenGods.join(", ")}`, sectionIndex });
    if (context.constraints.geukgukStatus === "not_enough_evidence" && mentioned(text, GEUKGUK_TERMS).length) issues.push({ code: "UNPROVIDED_GEUKGUK", message: "근거가 부족한 격국을 언급했습니다.", sectionIndex });
    if (context.constraints.candidateLanguageOnly && FINAL_GEUKGUK_PATTERN.test(text) && !text.includes("후보")) issues.push({ code: "FINAL_GEUKGUK_CLAIM", message: "격국을 확정형으로 표현했습니다.", sectionIndex });
    if (context.constraints.candidateLanguageOnly && (FINAL_YONGSIN_PATTERN.test(text) || YONGSIN_PATTERN.test(text)) && !text.includes("후보")) issues.push({ code: "FINAL_YONGSIN_CLAIM", message: "용신을 확정형으로 표현했습니다.", sectionIndex });
    if (!context.constraints.sinsalProvided && mentioned(text, SINSAL_TERMS).length) issues.push({ code: "UNPROVIDED_SINSAL", message: "제공되지 않은 신살을 언급했습니다.", sectionIndex });
    if (mentioned(text, [...UNLOG_OVERCERTAIN_EXPRESSIONS]).length) issues.push({ code: "OVERCERTAIN_LANGUAGE", message: "과도한 확정 표현이 포함되었습니다.", sectionIndex });
    if (UNLOG_DETERMINISTIC_EVENT_PATTERN.test(text)) issues.push({ code: "DETERMINISTIC_EVENT_PREDICTION", message: "연도별 사건을 확정적으로 예언했습니다.", sectionIndex });
    if (!context.constraints.medicalPredictionAllowed && UNLOG_MEDICAL_CERTAINTY_PATTERN.test(text)) issues.push({ code: "MEDICAL_PREDICTION", message: "건강·임신·사망·사고를 확정적으로 표현했습니다.", sectionIndex });
  });
  return { valid: issues.length === 0, issues };
}
