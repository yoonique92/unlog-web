import type { NormalizedSaju } from "../saju/types";
import { NATAL_RULES } from "./config";
import type { Evidence, Finding } from "./types";

const GROUPS = {
  independence: ["비견", "겁재"], expression: ["식신", "상관"],
  money: ["정재", "편재"], responsibility: ["정관", "편관", "칠살"],
  learning: ["정인", "편인"],
} as const;

function countGroup(saju: NormalizedSaju, names: readonly string[]) {
  return saju.tenGods.filter((item) => names.some((name) => item.name.includes(name))).length;
}

function tenGodEvidence(id: string, ruleId: string, names: readonly string[], count: number): Evidence {
  return { id, ruleId, type: "natal", source: "tenGods", description: `원국의 ${names.join("·")} 계열이 여러 자리에서 함께 확인됩니다.`, technicalDescription: `${names.join("/")} count=${count}`, weight: count };
}

export function analyzeNatalPatterns(saju: NormalizedSaju): Finding[] {
  const counts = Object.fromEntries(Object.entries(GROUPS).map(([key, names]) => [key, countGroup(saju, names)])) as Record<keyof typeof GROUPS, number>;
  const findings: Finding[] = [];
  if (counts.independence >= 2) findings.push({ id: "natal-independent-standards", category: "independence", title: "스스로 기준을 세우는 힘", summary: "남의 답을 그대로 따르기보다 직접 판단하고 자신의 방식으로 움직이려는 경향이 있습니다.", score: Math.min(90, 48 + counts.independence * 11), confidence: 0.72, evidence: [tenGodEvidence("natal-independent", "NATAL-001", GROUPS.independence, counts.independence)] });
  if (counts.expression >= 2) findings.push({ id: "natal-expression-output", category: "expression", title: "생각을 결과로 바꾸는 표현력", summary: "아이디어를 말·글·기획·제작처럼 눈에 보이는 결과로 연결할 때 강점이 살아납니다.", score: Math.min(90, 48 + counts.expression * 11), confidence: 0.72, evidence: [tenGodEvidence("natal-expression", "NATAL-002", GROUPS.expression, counts.expression)] });
  if (counts.responsibility >= 2) findings.push({ id: "natal-career-responsibility", category: "career", title: "책임을 오래 떠안는 경향", summary: "역할과 기준이 분명한 상황에서 꾸준히 책임을 완수하는 힘이 나타날 수 있습니다.", score: Math.min(90, 48 + counts.responsibility * 11), confidence: 0.72, evidence: [tenGodEvidence("natal-responsibility", "NATAL-003", GROUPS.responsibility, counts.responsibility)] });
  if (counts.learning >= 2) findings.push({ id: "natal-learning-depth", category: "personality", title: "깊이 이해하고 축적하는 힘", summary: "정보를 빠르게 소비하기보다 충분히 이해하고 자기 지식으로 쌓는 방식에 강점이 있습니다.", score: Math.min(90, 48 + counts.learning * 11), confidence: 0.72, evidence: [tenGodEvidence("natal-learning", "NATAL-004", GROUPS.learning, counts.learning)] });
  if (counts.money >= 2 && counts.expression >= 1) findings.push({ id: "natal-output-to-value", category: "money", title: "결과물을 가치로 연결하는 구조", summary: "자신이 만든 결과나 전문성을 현실적인 성과와 수익 구조로 연결하려는 흐름이 있습니다.", score: Math.min(92, 52 + counts.money * 8 + counts.expression * 5), confidence: 0.78, evidence: [tenGodEvidence("natal-money", "NATAL-005", GROUPS.money, counts.money), tenGodEvidence("natal-money-expression", "NATAL-006", GROUPS.expression, counts.expression)] });
  const disruptiveRelations = [...saju.relations.clashes, ...saju.relations.punishments, ...saju.relations.harms, ...saju.relations.breaks];
  if (disruptiveRelations.length >= NATAL_RULES.relationFindingMinimum) findings.push({ id: "natal-stability-change-tension", category: "change", title: "안정과 변화가 함께 작동하는 구조", summary: "평소에는 익숙한 질서를 지키려 하지만 긴장이 쌓이면 생활 방식이나 관계의 방향을 크게 바꾸려는 면이 함께 나타날 수 있습니다.", score: Math.min(88, 55 + disruptiveRelations.length * 7), confidence: 0.66, evidence: disruptiveRelations.slice(0, 3).map((relation, index) => ({ id: `natal-relation-${index}`, ruleId: "NATAL-007", type: "relation", source: `relations.${relation.kind}`, description: "원국 안에서 서로 다른 방향의 기운이 맞물리는 관계가 확인됩니다.", technicalDescription: relation.description })), tension: { sideA: "기존 질서와 안정 유지", sideB: "긴장 이후의 변화 선택", interpretation: "안정을 중요하게 여기지만 임계점을 넘으면 큰 변화를 선택할 수 있는 구조" } });
  if (findings.length === 0) findings.push({ id: "natal-balanced-expression", category: "stability", title: "한쪽보다 균형을 활용하는 구조", summary: "특정 성향 하나로 단정하기보다 상황에 따라 여러 자원을 조합하는 편에 가깝습니다.", score: 50, confidence: 0.55, evidence: [{ id: "natal-balanced", ruleId: "NATAL-008", type: "natal", source: "tenGods", description: "특정 십성 계열이 압도적이지 않아 전체 조합을 중심으로 판단했습니다." }] });
  return findings.slice(0, NATAL_RULES.maxCandidateFindings);
}
