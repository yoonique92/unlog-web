import { analyzeUnlogSaju } from "./engine";
import { analyzeMonthCommand } from "./geukguk";
import type { GoldenCase } from "./goldenTypes";
import { validateGoldenCaseDefinition } from "./goldenTypes";
import type { GeukgukCandidateType, StrengthContribution, StrengthLevel } from "./types";
import type { FiveElement } from "../saju/types";

const STRENGTH_ORDER: StrengthLevel[] = ["very_weak", "weak", "balanced_weak", "balanced", "balanced_strong", "strong", "very_strong"];
export type MissSeverity = "match" | "near" | "moderate" | "severe";

export interface CheckGroup {
  evaluated: boolean;
  passed: boolean;
  failures: string[];
}

export interface GoldenValidationResult {
  caseId: string;
  verificationStatus: GoldenCase["verification"]["status"];
  deterministic: CheckGroup & { pillarChecks: number; pillarPassedChecks: number; tenGodChecks: number; tenGodPassedChecks: number };
  structural: CheckGroup;
  strength: {
    evaluated: boolean;
    actual: StrengthLevel;
    accepted: StrengthLevel[];
    consensus?: number;
    passed: boolean;
    severity: MissSeverity;
    largestContributions: StrengthContribution[];
    potentialIssue?: string;
  };
  geukguk: {
    evaluated: boolean;
    actualCandidates: GeukgukCandidateType[];
    acceptedCandidates: GeukgukCandidateType[];
    matched: GeukgukCandidateType[];
    top1Hit: boolean;
    top3Hit: boolean;
  };
  johu: CandidateValidation<FiveElement>;
  eokbu: CandidateValidation<FiveElement>;
  observations: ValidationObservation[];
  warnings: string[];
}

export interface ValidationObservation {
  code: "EOKBU_CANDIDATE_AVOID_OVERLAP";
  element: FiveElement;
  candidateScore: number;
  candidateRank: number;
  message: string;
}

export interface StrengthBandOutcome {
  caseId: string;
  expectedBand: { min: StrengthLevel; max: StrengthLevel; allowedLevels: StrengthLevel[] };
  actual: StrengthLevel;
  matched: boolean;
  severity: MissSeverity;
  distance: number;
}

export interface CandidateValidation<T extends string> {
  evaluated: boolean;
  actualCandidates: T[];
  acceptedCandidates: T[];
  matched: T[];
  candidateHit: boolean;
  priorityHit: boolean;
}

export interface RatioMetric {
  matched: number;
  total: number;
  value: number | null;
}

export interface GoldenValidationSummary {
  totalCases: number;
  verificationCounts: Record<GoldenCase["verification"]["status"], number>;
  results: GoldenValidationResult[];
  metrics: {
    pillarsAccuracy: RatioMetric;
    tenGodsAccuracy: RatioMetric;
    structuralAccuracy: RatioMetric;
    strengthAgreement: RatioMetric;
    strengthSeverity: Record<MissSeverity, number>;
    geukgukTop1Accuracy: RatioMetric;
    geukgukTop3Recall: RatioMetric;
    geukgukCandidateRecall: RatioMetric;
    geukgukCandidatePrecision: RatioMetric;
    johuAgreement: RatioMetric;
    johuPriorityAgreement: RatioMetric;
    eokbuAgreement: RatioMetric;
    eokbuPriorityAgreement: RatioMetric;
  };
  strengthConfusionMatrix: Record<StrengthLevel, Record<StrengthLevel, number>>;
  strengthConfusionMatrixSampleCount: number;
  strengthBandOutcomes: StrengthBandOutcome[];
  ruleFailureFrequency: Array<{ ruleId: string; involvedInMismatches: number; caseIds: string[] }>;
}

const ratio = (matched: number, total: number): RatioMetric => ({ matched, total, value: total ? matched / total : null });

export function classifyStrengthMiss(actual: StrengthLevel, accepted: StrengthLevel[]): MissSeverity {
  if (!accepted.length || accepted.includes(actual)) return "match";
  const actualIndex = STRENGTH_ORDER.indexOf(actual);
  const distance = Math.min(...accepted.map((level) => Math.abs(actualIndex - STRENGTH_ORDER.indexOf(level))));
  return distance === 1 ? "near" : distance === 2 ? "moderate" : "severe";
}

export function getStrengthBandDistance(actual: StrengthLevel, accepted: StrengthLevel[]) {
  if (!accepted.length || accepted.includes(actual)) return 0;
  const actualIndex = STRENGTH_ORDER.indexOf(actual);
  return Math.min(...accepted.map((level) => Math.abs(actualIndex - STRENGTH_ORDER.indexOf(level))));
}

function missingByKey<A, E>(actual: A[], expected: E[], actualKey: (value: A) => string, expectedKey: (value: E) => string) {
  const actualKeys = new Set(actual.map(actualKey));
  return expected.filter((item) => !actualKeys.has(expectedKey(item)));
}

export function runGoldenCaseValidation(goldenCase: GoldenCase): GoldenValidationResult {
  const definition = validateGoldenCaseDefinition(goldenCase);
  const hasSources = goldenCase.verification.sources.length > 0;
  const mayEvaluate = definition.valid && hasSources;
  const warnings = [...definition.errors];
  if (!hasSources) warnings.push("출처가 없어 기대값을 검증 지표에 포함하지 않았습니다.");
  if (goldenCase.verification.status === "unverified") warnings.push("아직 교차 검증되지 않은 사례입니다.");
  const result = analyzeUnlogSaju({
    birthDate: goldenCase.birth.date, birthTime: goldenCase.birth.time,
    calendar: goldenCase.birth.calendar, gender: goldenCase.birth.gender ?? "male",
    timezone: goldenCase.birth.timezone ?? "Asia/Seoul",
  });
  const normalized = result.normalizedSaju;
  const deterministicFailures: string[] = [];
  let pillarChecks = 0;
  let pillarPassedChecks = 0;
  let tenGodChecks = 0;
  let tenGodPassedChecks = 0;
  const deterministic = goldenCase.expected.deterministic;
  if (mayEvaluate && deterministic) {
    const pillars = { yearPillar: `${normalized.pillars.year.stem}${normalized.pillars.year.branch}`, monthPillar: `${normalized.pillars.month.stem}${normalized.pillars.month.branch}`, dayPillar: `${normalized.pillars.day.stem}${normalized.pillars.day.branch}`, hourPillar: normalized.pillars.hour ? `${normalized.pillars.hour.stem}${normalized.pillars.hour.branch}` : undefined };
    for (const key of ["yearPillar", "monthPillar", "dayPillar", "hourPillar"] as const) {
      if (deterministic[key] === undefined) continue;
      pillarChecks += 1;
      if (deterministic[key] !== pillars[key]) deterministicFailures.push(`${key}: expected=${deterministic[key]}, actual=${pillars[key] ?? "none"}`);
      else pillarPassedChecks += 1;
    }
    const missingHidden = missingByKey(normalized.hiddenStems, deterministic.hiddenStems ?? [], (item) => `${item.pillar}:${item.stem}:${item.role}`, (item) => `${item.pillar}:${item.stem}:${item.layer}`);
    if (missingHidden.length) deterministicFailures.push(`hiddenStems 누락: ${missingHidden.map((item) => item.stem).join(",")}`);
    const missingTenGods = missingByKey(normalized.tenGods, deterministic.tenGods ?? [], (item) => `${item.pillar}:${item.target}:${item.name}`, (item) => `${item.pillar}:${item.target}:${item.name}`);
    tenGodChecks = deterministic.tenGods?.length ?? 0;
    tenGodPassedChecks = tenGodChecks - missingTenGods.length;
    if (missingTenGods.length) deterministicFailures.push(`tenGods 누락: ${missingTenGods.map((item) => item.name).join(",")}`);
    if (deterministic.daeunDirection && deterministic.daeunDirection !== normalized.daeunMeta.direction) deterministicFailures.push(`daeunDirection: expected=${deterministic.daeunDirection}, actual=${normalized.daeunMeta.direction}`);
    if (deterministic.daeunStartAge !== undefined && Math.abs(deterministic.daeunStartAge - normalized.daeunMeta.startAge) > 0.01) deterministicFailures.push(`daeunStartAge: expected=${deterministic.daeunStartAge}, actual=${normalized.daeunMeta.startAge}`);
  }

  const structuralFailures: string[] = [];
  const structural = goldenCase.expected.structural;
  if (mayEvaluate && structural) {
    if (structural.deukryeong !== undefined && structural.deukryeong !== "uncertain" && structural.deukryeong !== (result.analysis.strength.factors.deukryeong.level !== "weak")) structuralFailures.push("deukryeong 불일치");
    const missingRoots = (structural.roots ?? []).filter((expected) => normalized.hiddenStems.every((actual) => "depth" in expected
      ? actual.branch !== expected.branch || actual.stem !== expected.stem || actual.role !== expected.depth || (expected.pillar !== undefined && actual.pillar !== expected.pillar)
      : actual.pillar !== expected.pillar || actual.stem !== expected.stem || actual.role !== expected.layer));
    if (missingRoots.length) structuralFailures.push(`roots 누락: ${missingRoots.map((item) => item.stem).join(",")}`);
    const monthCommand = analyzeMonthCommand(normalized);
    const actualExposed = monthCommand.hiddenStems.filter((item) => item.exposed).map((item) => item.stem);
    const missingExposed = (structural.exposedStems ?? []).filter((stem) => !actualExposed.includes(stem));
    if (missingExposed.length) structuralFailures.push(`exposedStems 누락: ${missingExposed.join(",")}`);
    const missingExposureDetails = (structural.exposures ?? []).filter((expected) => !monthCommand.hiddenStems.some((actual) => actual.stem === expected.hiddenStem && actual.exposed && expected.hiddenStem === expected.exposedStem));
    if (missingExposureDetails.length) structuralFailures.push(`exposures 누락: ${missingExposureDetails.map((item) => item.hiddenStem).join(",")}`);
    if (structural.season && structural.season !== normalized.seasonal.season) structuralFailures.push(`season: expected=${structural.season}, actual=${normalized.seasonal.season}`);
    const relationText = Object.values(normalized.relations).flat().map((item) => item.description);
    const missingRelations = (structural.relations ?? []).filter((expected) => !relationText.some((actual) => actual.includes(expected)));
    if (missingRelations.length) structuralFailures.push(`relations 누락: ${missingRelations.join(",")}`);
    const relationsByKind = {
      combination: normalized.relations.combinations,
      clash: normalized.relations.clashes,
      punishment: normalized.relations.punishments,
      break: normalized.relations.breaks,
      harm: normalized.relations.harms,
    };
    const missingRelationDetails = (structural.relationDetails ?? []).filter((expected) => !relationsByKind[expected.kind].some((actual) => actual.description.includes(expected.description)));
    if (missingRelationDetails.length) structuralFailures.push(`relationDetails 누락: ${missingRelationDetails.map((item) => item.description).join(",")}`);
  }

  const expectedStrength = mayEvaluate ? goldenCase.expected.interpretive?.strength : undefined;
  const severity = classifyStrengthMiss(result.analysis.strength.level, expectedStrength?.allowedLevels ?? []);
  const largestContributions = [...result.analysis.strength.contributions].sort((a, b) => Math.abs(b.adjustedWeight) - Math.abs(a.adjustedWeight)).slice(0, 5);
  const candidateCheck = <T extends string>(actual: T[], accepted: T[] | undefined): CandidateValidation<T> => {
    const expected = mayEvaluate ? accepted ?? [] : [];
    const matched = actual.filter((item) => expected.includes(item));
    return { evaluated: mayEvaluate && Boolean(accepted?.length), actualCandidates: actual, acceptedCandidates: expected, matched, candidateHit: matched.length > 0, priorityHit: Boolean(actual[0] && expected.includes(actual[0])) };
  };
  const geukAccepted = mayEvaluate ? goldenCase.expected.interpretive?.geukguk?.acceptedCandidates ?? [] : [];
  const geukActual = result.analysis.geukguk.candidates.map((item) => item.type);
  const geukMatched = geukActual.filter((item) => geukAccepted.includes(item));
  const johu = candidateCheck(result.analysis.johu.preferredElements.map((item) => item.element), goldenCase.expected.interpretive?.johu?.preferredElements);
  const eokbu = candidateCheck(result.analysis.yongsin.eokbu.candidates.map((item) => item.element), goldenCase.expected.interpretive?.eokbu?.preferredElements);
  const avoidedElements = new Set(result.analysis.yongsin.eokbu.avoidCandidates?.map((item) => item.element) ?? []);
  const observations: ValidationObservation[] = result.analysis.yongsin.eokbu.candidates.flatMap((candidate, index) => avoidedElements.has(candidate.element) ? [{
    code: "EOKBU_CANDIDATE_AVOID_OVERLAP" as const,
    element: candidate.element,
    candidateScore: candidate.score,
    candidateRank: index + 1,
    message: "동일 오행이 candidate와 avoid에 동시에 존재하여 ReadingContext에서 상충 해석 가능성이 있음.",
  }] : []);

  return {
    caseId: goldenCase.id, verificationStatus: goldenCase.verification.status,
    deterministic: { evaluated: mayEvaluate && Boolean(deterministic), passed: deterministicFailures.length === 0, failures: deterministicFailures, pillarChecks, pillarPassedChecks, tenGodChecks, tenGodPassedChecks },
    structural: { evaluated: mayEvaluate && Boolean(structural), passed: structuralFailures.length === 0, failures: structuralFailures },
    strength: { evaluated: Boolean(expectedStrength), actual: result.analysis.strength.level, accepted: expectedStrength?.allowedLevels ?? [], consensus: expectedStrength?.consensus, passed: severity === "match", severity, largestContributions, potentialIssue: severity === "match" ? undefined : `큰 기여 규칙(${largestContributions.map((item) => item.ruleId).join(", ")})의 가중치 또는 상호작용 검토가 필요할 수 있습니다.` },
    geukguk: { evaluated: mayEvaluate && geukAccepted.length > 0, actualCandidates: geukActual, acceptedCandidates: geukAccepted, matched: geukMatched, top1Hit: Boolean(geukActual[0] && geukAccepted.includes(geukActual[0])), top3Hit: geukMatched.length > 0 },
    johu, eokbu, observations, warnings,
  };
}

export function runGoldenValidation(cases: readonly GoldenCase[] = []): GoldenValidationSummary {
  const results = cases.map(runGoldenCaseValidation);
  const verificationCounts = { unverified: 0, cross_checked: 0, expert_verified: 0 };
  cases.forEach((item) => { verificationCounts[item.verification.status] += 1; });
  const confusion = Object.fromEntries(STRENGTH_ORDER.map((expected) => [expected, Object.fromEntries(STRENGTH_ORDER.map((actual) => [actual, 0]))])) as Record<StrengthLevel, Record<StrengthLevel, number>>;
  const severity = { match: 0, near: 0, moderate: 0, severe: 0 };
  const ruleFailures = new Map<string, Set<string>>();
  for (const item of results.filter((entry) => entry.strength.evaluated)) {
    severity[item.strength.severity] += 1;
    if (item.strength.accepted.length === 1) confusion[item.strength.accepted[0]][item.strength.actual] += 1;
    if (!item.strength.passed) for (const contribution of item.strength.largestContributions) {
      const ids = ruleFailures.get(contribution.ruleId) ?? new Set<string>();
      ids.add(item.caseId); ruleFailures.set(contribution.ruleId, ids);
    }
  }
  const sumMetric = (select: (item: GoldenValidationResult) => { evaluated: boolean; passed: boolean }) => {
    const checks = results.map(select).filter((item) => item.evaluated);
    return ratio(checks.filter((item) => item.passed).length, checks.length);
  };
  const candidateMetric = (select: (item: GoldenValidationResult) => CandidateValidation<string>, field: "candidateHit" | "priorityHit") => {
    const checks = results.map(select).filter((item) => item.evaluated);
    return ratio(checks.filter((item) => item[field]).length, checks.length);
  };
  const geukChecks = results.filter((item) => item.geukguk.evaluated);
  const geukMatchedTotal = geukChecks.reduce((sum, item) => sum + item.geukguk.matched.length, 0);
  const geukAcceptedTotal = geukChecks.reduce((sum, item) => sum + item.geukguk.acceptedCandidates.length, 0);
  const geukActualTotal = geukChecks.reduce((sum, item) => sum + item.geukguk.actualCandidates.length, 0);
  const strengthChecks = results.filter((item) => item.strength.evaluated);
  const strengthBandOutcomes: StrengthBandOutcome[] = strengthChecks.flatMap((item) => {
    if (!item.strength.accepted.length) return [];
    const indexes = item.strength.accepted.map((level) => STRENGTH_ORDER.indexOf(level));
    return [{
      caseId: item.caseId,
      expectedBand: {
        min: STRENGTH_ORDER[Math.min(...indexes)],
        max: STRENGTH_ORDER[Math.max(...indexes)],
        allowedLevels: [...item.strength.accepted],
      },
      actual: item.strength.actual,
      matched: item.strength.passed,
      severity: item.strength.severity,
      distance: getStrengthBandDistance(item.strength.actual, item.strength.accepted),
    }];
  });
  const strengthConfusionMatrixSampleCount = strengthChecks.filter((item) => item.strength.accepted.length === 1).length;
  return {
    totalCases: cases.length, verificationCounts, results,
    metrics: {
      pillarsAccuracy: ratio(results.reduce((sum, item) => sum + item.deterministic.pillarPassedChecks, 0), results.reduce((sum, item) => sum + item.deterministic.pillarChecks, 0)),
      tenGodsAccuracy: ratio(results.reduce((sum, item) => sum + item.deterministic.tenGodPassedChecks, 0), results.reduce((sum, item) => sum + item.deterministic.tenGodChecks, 0)),
      structuralAccuracy: sumMetric((item) => item.structural),
      strengthAgreement: ratio(strengthChecks.filter((item) => item.strength.passed).length, strengthChecks.length),
      strengthSeverity: severity,
      geukgukTop1Accuracy: ratio(geukChecks.filter((item) => item.geukguk.top1Hit).length, geukChecks.length),
      geukgukTop3Recall: ratio(geukChecks.filter((item) => item.geukguk.top3Hit).length, geukChecks.length),
      geukgukCandidateRecall: ratio(geukMatchedTotal, geukAcceptedTotal),
      geukgukCandidatePrecision: ratio(geukMatchedTotal, geukActualTotal),
      johuAgreement: candidateMetric((item) => item.johu, "candidateHit"),
      johuPriorityAgreement: candidateMetric((item) => item.johu, "priorityHit"),
      eokbuAgreement: candidateMetric((item) => item.eokbu, "candidateHit"),
      eokbuPriorityAgreement: candidateMetric((item) => item.eokbu, "priorityHit"),
    },
    strengthConfusionMatrix: confusion, strengthConfusionMatrixSampleCount, strengthBandOutcomes,
    ruleFailureFrequency: [...ruleFailures].map(([ruleId, ids]) => ({ ruleId, involvedInMismatches: ids.size, caseIds: [...ids] })).sort((a, b) => b.involvedInMismatches - a.involvedInMismatches),
  };
}

const metricLine = (name: string, metric: RatioMetric) => `${name}: ${metric.total ? `${metric.matched} / ${metric.total}` : "NO VERIFIED CASES"}`;

export function formatGoldenValidationReport(summary: GoldenValidationSummary) {
  const singletonMatrixLines = STRENGTH_ORDER.flatMap((expected) => STRENGTH_ORDER.flatMap((actual) => {
    const count = summary.strengthConfusionMatrix[expected][actual];
    return count ? [`${expected} -> ${actual}: ${count}`] : [];
  }));
  return [
    "UNLOG MYEONGRI VALIDATION", "=========================", "", `Golden Cases: ${summary.totalCases}`,
    `Unverified: ${summary.verificationCounts.unverified}`, `Cross checked: ${summary.verificationCounts.cross_checked}`, `Expert verified: ${summary.verificationCounts.expert_verified}`,
    "", "DETERMINISTIC", "-------------", metricLine("Pillars", summary.metrics.pillarsAccuracy), metricLine("Ten Gods", summary.metrics.tenGodsAccuracy),
    "", "STRUCTURAL", "----------", metricLine("Structural", summary.metrics.structuralAccuracy),
    "", "STRENGTH", "--------", metricLine("Agreement", summary.metrics.strengthAgreement), `Match: ${summary.metrics.strengthSeverity.match}`, `Near: ${summary.metrics.strengthSeverity.near}`, `Moderate: ${summary.metrics.strengthSeverity.moderate}`, `Severe: ${summary.metrics.strengthSeverity.severe}`,
    "", "Range-aware outcomes:", ...summary.strengthBandOutcomes.map((item) => `- ${item.caseId}: [${item.expectedBand.min} … ${item.expectedBand.max}] -> ${item.actual} / ${item.severity} / distance ${item.distance}`), ...(summary.strengthBandOutcomes.length ? [] : ["NO VERIFIED CASES"]),
    "", "Standard confusion matrix:", ...(summary.strengthConfusionMatrixSampleCount ? singletonMatrixLines : ["NO SINGLETON EXPECTED CASES"]),
    "", "GEUKGUK", "-------", metricLine("Top-1", summary.metrics.geukgukTop1Accuracy), metricLine("Top-3", summary.metrics.geukgukTop3Recall),
    "", "JOHU", "----", metricLine("Candidate hit", summary.metrics.johuAgreement), metricLine("Priority hit", summary.metrics.johuPriorityAgreement),
    "", "EOKBU", "-----", metricLine("Candidate hit", summary.metrics.eokbuAgreement), metricLine("Priority hit", summary.metrics.eokbuPriorityAgreement),
    "", "POTENTIALLY PROBLEMATIC PROVISIONAL RULES", "-----------------------------------------", ...(summary.ruleFailureFrequency.length ? summary.ruleFailureFrequency.map((item) => `${item.ruleId}: involved in mismatches ${item.involvedInMismatches}`) : ["NO VERIFIED CASES"]),
  ].join("\n");
}
