export const FIVE_ELEMENTS_KO = ["목", "화", "토", "금", "수"] as const;
export type FiveElementKo = (typeof FIVE_ELEMENTS_KO)[number];

export const TEN_GOD_NAMES = [
  "비견",
  "겁재",
  "식신",
  "상관",
  "편재",
  "정재",
  "편관",
  "정관",
  "편인",
  "정인",
] as const;
export type TenGodName = (typeof TEN_GOD_NAMES)[number];

export type SajuReadingSource = {
  readonly dayStem: string;
  readonly fiveElements: Readonly<Record<FiveElementKo, number>>;
  readonly tenGods: {
    readonly year: { readonly stem: string; readonly branch: string };
    readonly month: { readonly stem: string; readonly branch: string };
    readonly day: { readonly stem: string; readonly branch: string };
    readonly hour: { readonly stem: string; readonly branch: string };
  };
  readonly birthTimeUnknown: boolean;
};

export type TenGodOccurrence = {
  readonly name: TenGodName;
  readonly position: "year" | "month" | "day" | "hour";
  readonly target: "stem" | "branch";
};

export type DominantTenGodFact = {
  readonly name: TenGodName;
  readonly count: number;
  readonly locations: readonly string[];
};

export type SajuReadingFacts = {
  readonly dayMaster: {
    readonly stem: string;
    readonly koreanName: string;
    readonly element: FiveElementKo;
    readonly yinYang: "양" | "음";
  };
  readonly fiveElements: Readonly<Record<FiveElementKo, number>>;
  readonly tenGods: {
    readonly counts: Readonly<Record<TenGodName, number>>;
    readonly occurrences: readonly TenGodOccurrence[];
    readonly dominant: readonly DominantTenGodFact[];
  };
  readonly birthTimeUnknown: boolean;
};

export type SajuReadingSectionCopy = {
  readonly headline: string;
  readonly paragraphs: readonly string[];
  readonly sourceFacts: readonly string[];
};

export type TenGodReadingCopy = {
  readonly name: TenGodName;
  readonly count: number;
  readonly headline: string;
  readonly body: string;
  readonly sourceFacts: readonly string[];
};

export type SajuReadingDocument = {
  readonly facts: SajuReadingFacts;
  readonly dayMaster: SajuReadingSectionCopy;
  readonly fiveElements: SajuReadingSectionCopy;
  readonly tenGods: readonly TenGodReadingCopy[];
};
