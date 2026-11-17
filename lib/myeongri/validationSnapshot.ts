import type { GoldenValidationSummary } from "./validation";

export interface ValidationSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  fixtureOnly: true;
  metrics: GoldenValidationSummary["metrics"];
  cases: Array<{
    caseId: string;
    verificationStatus: string;
    deterministicPassed: boolean;
    structuralPassed: boolean;
    strengthActual: string;
    strengthSeverity: string;
    warnings: string[];
  }>;
}

export function createValidationSnapshot(summary: GoldenValidationSummary, generatedAt = new Date().toISOString()): ValidationSnapshot {
  return {
    schemaVersion: 1, generatedAt, fixtureOnly: true, metrics: summary.metrics,
    cases: summary.results.map((item) => ({ caseId: item.caseId, verificationStatus: item.verificationStatus, deterministicPassed: item.deterministic.passed, structuralPassed: item.structural.passed, strengthActual: item.strength.actual, strengthSeverity: item.strength.severity, warnings: item.warnings })),
  };
}

export function serializeValidationSnapshot(summary: GoldenValidationSummary, generatedAt?: string) {
  return JSON.stringify(createValidationSnapshot(summary, generatedAt), null, 2);
}
