import type { FiveElement } from "../saju/types";
import { CONTROLLED_BY, GENERATED_BY, GENERATES } from "./config";

export type ElementEffect = "same" | "resource" | "drain" | "wealth" | "control" | "neutral";

export function getElementEffect(dayMaster: FiveElement, other: FiveElement): ElementEffect {
  if (other === dayMaster) return "same";
  if (other === GENERATED_BY[dayMaster]) return "resource";
  if (other === GENERATES[dayMaster]) return "drain";
  if (other === CONTROLLED_BY[dayMaster]) return "control";
  return "wealth";
}

export function isSupportive(dayMaster: FiveElement, other: FiveElement) {
  const effect = getElementEffect(dayMaster, other);
  return effect === "same" || effect === "resource";
}

export const ELEMENT_LABELS: Record<FiveElement, string> = {
  wood: "목", fire: "화", earth: "토", metal: "금", water: "수",
};
