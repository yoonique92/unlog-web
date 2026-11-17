import type { RuleMetadata } from "./types";

const provisional = (id: string, notes: string): RuleMetadata => ({
  id, school: "unlog", status: "provisional", notes,
});

export const RULE_METADATA: Record<string, RuleMetadata> = Object.fromEntries([
  provisional("STR-001", "월령 오행과 일간의 생극 방향에 대한 운로그 V1.5 가중치"),
  provisional("STR-002", "지장간 본기 통근 가중치"),
  provisional("STR-003", "지장간 중기 통근 가중치"),
  provisional("STR-004", "지장간 여기 통근 가중치"),
  provisional("STR-005", "천간·지지 위치별 비겁/인성 지원 가중치"),
  provisional("STR-006", "천간·지지 위치별 식상/재성 소모 가중치"),
  provisional("STR-007", "천간·지지 위치별 관성 제어 가중치"),
  provisional("JOHU-001", "계절과 원국 화·수 분포 기반 한난조습 모델"),
  provisional("JOHU-002", "검증된 세부 조후 규칙 확장점; 현재 등록 규칙 없음"),
  provisional("GEUK-001", "월지 지장간 층위별 후보 가중치"),
  provisional("GEUK-002", "월지 지장간 천간 투출 보정"),
  provisional("GEUK-003", "월지 지장간 원국 통근 보정"),
  provisional("GEUK-004", "월지 관계 변동 시 후보 신뢰도 감점"),
  provisional("GEUK-005", "극단 강약 구조의 특수격 검토 신호"),
  provisional("GEUK-006", "일간별 건록지와 월지 일치 여부를 확인하는 건록 후보 전제조건"),
  provisional("EOKBU-001", "신강 축과 오행 작용을 이용한 억부 후보 기초값"),
  provisional("EOKBU-002", "원국 오행 과소·과다 보정"),
  provisional("EOKBU-003", "월령과 통근을 고려한 후보 위험 신호"),
  ...Array.from({ length: 8 }, (_, index) => provisional(`NATAL-00${index + 1}`, "원국 복합 Finding 규칙")),
  provisional("TIME-001", "세운과 원국 일간의 오행 영향 비교"),
  provisional("TIME-002", "대운과 세운의 중첩 영향 비교"),
].map((rule) => [rule.id, rule]));

export function getRuleMetadata(ruleId: string): RuleMetadata {
  return RULE_METADATA[ruleId] ?? {
    id: ruleId, school: "unverified", status: "provisional", notes: "메타데이터 등록 필요",
  };
}

export const VERIFIED_RULE_COUNT = Object.values(RULE_METADATA).filter((rule) => rule.status === "verified").length;
