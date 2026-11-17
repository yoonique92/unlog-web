export function getLegacyDayStrength(result: {
  advanced: { dayStrength: { strength: string } };
}) {
  // TODO UNLOG-MYEONGRI: legacy ssaju strength.
  // Golden case 전문가 검증 후에만 신규 strength로 교체한다.
  const strength = result.advanced.dayStrength.strength;
  return strength === "strong" || strength === "weak" ? strength : "neutral";
}
