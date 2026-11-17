import type { Finding } from "./types";

export function confidenceFromEvidence(finding: Finding) {
  const ruleCount = new Set(finding.evidence.map((item) => item.ruleId)).size;
  const sourceCount = new Set(finding.evidence.map((item) => item.source)).size;
  return Math.min(0.92, Math.max(0.45, 0.48 + ruleCount * 0.07 + sourceCount * 0.04));
}
