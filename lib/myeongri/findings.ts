import { NATAL_RULES } from "./config";
import { confidenceFromEvidence } from "./confidence";
import type { Finding } from "./types";

function rank(finding: Finding) {
  const evidenceQuality = new Set(finding.evidence.map((item) => item.ruleId)).size * 8;
  const timelineBonus = finding.evidence.some((item) => item.type === "daeun" || item.type === "seyun") ? 12 : 0;
  return finding.score + evidenceQuality + timelineBonus + finding.confidence * 20;
}

export function aggregateFindings(candidates: Finding[]): Finding[] {
  const unique = new Map<string, Finding>();
  for (const candidate of candidates) {
    if (candidate.evidence.length === 0) continue;
    const key = `${candidate.category}:${candidate.title}`;
    const existing = unique.get(key);
    if (!existing || rank(candidate) > rank(existing)) unique.set(key, candidate);
  }
  return [...unique.values()]
    .map((finding) => ({ ...finding, confidence: Math.max(finding.confidence, confidenceFromEvidence(finding)) }))
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, NATAL_RULES.maxFinalFindings);
}
