import type { CanonicalRelationSal, PillarPosition } from "./types";
import { RELATION_SAL_DEFINITIONS } from "./relationSalCalculator";
import { BONG_START_BRANCH, getAdjacentBranches, getGeonrokBranch } from "./twelveStagePolicy";

export type SalCategory =
  | "twelve_sal"
  | "gwiin"
  | "rok"
  | "relationship"
  | "movement"
  | "special";

export interface SalDefinition {
  id: string;
  name: string;
  category: SalCategory;
  displayOrder: number;
}

export const SAL_DEFINITIONS = {
  twelve_geop_sal: { id: "twelve_geop_sal", name: "겁살", category: "twelve_sal", displayOrder: 100 },
  twelve_jae_sal: { id: "twelve_jae_sal", name: "재살", category: "twelve_sal", displayOrder: 101 },
  twelve_cheong_sal: { id: "twelve_cheong_sal", name: "천살", category: "twelve_sal", displayOrder: 102 },
  twelve_ji_sal: { id: "twelve_ji_sal", name: "지살", category: "twelve_sal", displayOrder: 103 },
  twelve_nyeon_sal: { id: "twelve_nyeon_sal", name: "년살", category: "twelve_sal", displayOrder: 104 },
  twelve_wol_sal: { id: "twelve_wol_sal", name: "월살", category: "twelve_sal", displayOrder: 105 },
  twelve_mangsin_sal: { id: "twelve_mangsin_sal", name: "망신살", category: "twelve_sal", displayOrder: 106 },
  twelve_jangseong_sal: { id: "twelve_jangseong_sal", name: "장성살", category: "twelve_sal", displayOrder: 107 },
  twelve_banan_sal: { id: "twelve_banan_sal", name: "반안살", category: "twelve_sal", displayOrder: 108 },
  twelve_yeokma_sal: { id: "twelve_yeokma_sal", name: "역마살", category: "twelve_sal", displayOrder: 109 },
  twelve_yukhae_sal: { id: "twelve_yukhae_sal", name: "육해살", category: "twelve_sal", displayOrder: 110 },
  twelve_hwagae_sal: { id: "twelve_hwagae_sal", name: "화개살", category: "twelve_sal", displayOrder: 111 },
  cheon_eul_gwiin: { id: "cheon_eul_gwiin", name: "천을귀인", category: "gwiin", displayOrder: 200 },
  cheon_deok_gwiin: { id: "cheon_deok_gwiin", name: "천덕귀인", category: "gwiin", displayOrder: 210 },
  wol_deok_gwiin: { id: "wol_deok_gwiin", name: "월덕귀인", category: "gwiin", displayOrder: 220 },
  taegeuk_gwiin: { id: "taegeuk_gwiin", name: "태극귀인", category: "gwiin", displayOrder: 230 },
  mungok_gwiin: { id: "mungok_gwiin", name: "문곡귀인", category: "gwiin", displayOrder: 240 },
  munchang_gwiin: { id: "munchang_gwiin", name: "문창귀인", category: "gwiin", displayOrder: 250 },
  cheonju_gwiin: { id: "cheonju_gwiin", name: "천주귀인", category: "gwiin", displayOrder: 260 },
  gwangwi_hakgwan: { id: "gwangwi_hakgwan", name: "관귀학관", category: "gwiin", displayOrder: 270 },
  hakdang_gwiin: { id: "hakdang_gwiin", name: "학당귀인", category: "gwiin", displayOrder: 280 },
  bokseong_gwiin: { id: "bokseong_gwiin", name: "복성귀인", category: "gwiin", displayOrder: 290 },
  cheonbok_gwiin: { id: "cheonbok_gwiin", name: "천복귀인", category: "gwiin", displayOrder: 291 },
  geonrok: { id: "geonrok", name: "건록", category: "rok", displayOrder: 300 },
  amrok: { id: "amrok", name: "암록", category: "rok", displayOrder: 310 },
  geumyeo: { id: "geumyeo", name: "금여", category: "rok", displayOrder: 320 },
  hyeoprok: { id: "hyeoprok", name: "협록", category: "rok", displayOrder: 330 },
  biin_sal: { id: "biin_sal", name: "비인살", category: "special", displayOrder: 340 },
  hyeonchim_sal: { id: "hyeonchim_sal", name: "현침살", category: "special", displayOrder: 350 },
  yangin_sal: { id: "yangin_sal", name: "양인살", category: "special", displayOrder: 360 },
  baekho_daesal: { id: "baekho_daesal", name: "백호대살", category: "special", displayOrder: 370 },
  gwimun_gwansal: {
    id: RELATION_SAL_DEFINITIONS.gwimun_gwansal.id,
    name: RELATION_SAL_DEFINITIONS.gwimun_gwansal.name,
    category: RELATION_SAL_DEFINITIONS.gwimun_gwansal.pillarProjection.category,
    displayOrder: RELATION_SAL_DEFINITIONS.gwimun_gwansal.pillarProjection.displayOrder,
  },
  nakjeong_gwansal: { id: "nakjeong_gwansal", name: "낙정관살", category: "special", displayOrder: 390 },
  dohwa_sal: { id: "dohwa_sal", name: "도화살", category: "relationship", displayOrder: 400 },
  yeokma_sal: { id: "yeokma_sal", name: "역마살", category: "movement", displayOrder: 410 },
  hwagae_sal: { id: "hwagae_sal", name: "화개살", category: "special", displayOrder: 420 },
  /** 天門星: canonical pillar branch가 戌 또는 亥인지 독립 판정한다. */
  cheonmun_seong: { id: "cheonmun_seong", name: "천문성", category: "special", displayOrder: 430 },
  /** 皇恩大赦: canonical 월지로 target을 정해 일지와 시지만 판정한다. */
  hwangeun_daesa: { id: "hwangeun_daesa", name: "황은대사", category: "special", displayOrder: 440 },
  /** 天醫星: canonical 월지의 이전 지지를 연지·일지·시지에서 판정한다. */
  cheonui_seong: { id: "cheonui_seong", name: "천의성", category: "special", displayOrder: 450 },
  /** 孤鸞煞: 현대 한국 만세력의 L5 완전 간지를 네 pillar에서 독립 판정한다. */
  goran_sal: { id: "goran_sal", name: "고란살", category: "relationship", displayOrder: 460 },
  /** 寡宿煞: canonical 년지의 방합 group에서 target 지지를 파생한다. */
  gwasuk_sal: { id: "gwasuk_sal", name: "과숙살", category: "relationship", displayOrder: 470 },
} as const satisfies Record<string, SalDefinition>;

export type SalId = keyof typeof SAL_DEFINITIONS;
export type TwelveSalId = Extract<SalId, `twelve_${string}`>;
export type SpecialSalId = Exclude<SalId, TwelveSalId>;
export type SalResult = (typeof SAL_DEFINITIONS)[SalId];

export interface CanonicalSal {
  /** Legacy UI/API compatibility fields. */
  twelveSal: string;
  specialSals: string[];
  /** Stable identifiers and metadata for new consumers. */
  twelveSalId: TwelveSalId | null;
  sals: SalResult[];
}

export type CanonicalSals = Record<PillarPosition, CanonicalSal>;

interface CanonicalSalInput {
  pillars: Record<PillarPosition, { stem: string; branch: string }>;
  /** Canonical 봉법 12운성 결과. 건록 판정을 중복 계산하지 않고 재사용한다. */
  bongStages?: Partial<Record<PillarPosition, string>>;
  birthTimeUnknown?: boolean;
  relationSals?: readonly CanonicalRelationSal[];
}

interface SalContext {
  yearBranch: string;
  monthBranch: string;
  dayBranch: string;
  dayStem: string;
}

const TWELVE_SAL_BY_YEAR_GROUP: Record<string, Record<string, TwelveSalId>> = {
  申子辰: {
    巳: "twelve_geop_sal", 午: "twelve_jae_sal", 未: "twelve_cheong_sal", 申: "twelve_ji_sal",
    酉: "twelve_nyeon_sal", 戌: "twelve_wol_sal", 亥: "twelve_mangsin_sal", 子: "twelve_jangseong_sal",
    丑: "twelve_banan_sal", 寅: "twelve_yeokma_sal", 卯: "twelve_yukhae_sal", 辰: "twelve_hwagae_sal",
  },
  寅午戌: {
    亥: "twelve_geop_sal", 子: "twelve_jae_sal", 丑: "twelve_cheong_sal", 寅: "twelve_ji_sal",
    卯: "twelve_nyeon_sal", 辰: "twelve_wol_sal", 巳: "twelve_mangsin_sal", 午: "twelve_jangseong_sal",
    未: "twelve_banan_sal", 申: "twelve_yeokma_sal", 酉: "twelve_yukhae_sal", 戌: "twelve_hwagae_sal",
  },
  亥卯未: {
    申: "twelve_geop_sal", 酉: "twelve_jae_sal", 戌: "twelve_cheong_sal", 亥: "twelve_ji_sal",
    子: "twelve_nyeon_sal", 丑: "twelve_wol_sal", 寅: "twelve_mangsin_sal", 卯: "twelve_jangseong_sal",
    辰: "twelve_banan_sal", 巳: "twelve_yeokma_sal", 午: "twelve_yukhae_sal", 未: "twelve_hwagae_sal",
  },
  巳酉丑: {
    寅: "twelve_geop_sal", 卯: "twelve_jae_sal", 辰: "twelve_cheong_sal", 巳: "twelve_ji_sal",
    午: "twelve_nyeon_sal", 未: "twelve_wol_sal", 申: "twelve_mangsin_sal", 酉: "twelve_jangseong_sal",
    戌: "twelve_banan_sal", 亥: "twelve_yeokma_sal", 子: "twelve_yukhae_sal", 丑: "twelve_hwagae_sal",
  },
};

const DOHWA_BY_DAY_GROUP: Record<string, string> = {
  寅午戌: "卯", 申子辰: "酉", 巳酉丑: "午", 亥卯未: "子",
};
const YEOKMA_BY_DAY_GROUP: Record<string, string> = {
  寅午戌: "申", 申子辰: "寅", 巳酉丑: "亥", 亥卯未: "巳",
};
const HWAGAE_BY_DAY_GROUP: Record<string, string> = {
  寅午戌: "戌", 申子辰: "辰", 巳酉丑: "丑", 亥卯未: "未",
};
const CHEONEUL_BY_DAY_STEM: Record<string, readonly string[]> = {
  甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
  乙: ["子", "申"], 己: ["子", "申"],
  丙: ["亥", "酉"], 丁: ["亥", "酉"],
  壬: ["卯", "巳"], 癸: ["卯", "巳"],
  辛: ["寅", "午"],
};

const CHEONDEOK_BY_MONTH_BRANCH: Record<string, { target: "stem" | "branch"; value: string }> = {
  寅: { target: "stem", value: "丁" }, 卯: { target: "branch", value: "申" },
  辰: { target: "stem", value: "壬" }, 巳: { target: "stem", value: "辛" },
  午: { target: "branch", value: "亥" }, 未: { target: "stem", value: "甲" },
  申: { target: "stem", value: "癸" }, 酉: { target: "branch", value: "寅" },
  戌: { target: "stem", value: "丙" }, 亥: { target: "stem", value: "乙" },
  子: { target: "branch", value: "巳" }, 丑: { target: "stem", value: "庚" },
};

const WOLDEOK_BY_MONTH_GROUP: Record<string, string> = {
  寅午戌: "丙", 申子辰: "壬", 亥卯未: "甲", 巳酉丑: "庚",
};

const TAEGEUK_BY_DAY_STEM: Record<string, readonly string[]> = {
  甲: ["子", "午"], 乙: ["子", "午"],
  丙: ["卯", "酉"], 丁: ["卯", "酉"],
  戊: ["辰", "戌", "丑", "未"], 己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"], 辛: ["寅", "亥"],
  壬: ["巳", "申"], 癸: ["巳", "申"],
};

const MUNGOK_BY_DAY_STEM: Record<string, string> = {
  甲: "亥", 乙: "子", 丙: "寅", 丁: "卯", 戊: "寅",
  己: "卯", 庚: "巳", 辛: "午", 壬: "申", 癸: "酉",
};

const MUNCHANG_BY_DAY_STEM: Record<string, string> = {
  甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申",
  己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯",
};

const CHEONJU_GWIIN_BY_DAY_STEM: Record<string, string> = {
  甲: "巳", 乙: "午", 丙: "巳", 丁: "午", 戊: "申",
  己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯",
};

const GWANGWI_HAKGWAN_BY_DAY_STEM: Record<string, string> = {
  甲: "巳", 乙: "巳", 丙: "申", 丁: "申", 戊: "亥",
  己: "亥", 庚: "寅", 辛: "寅", 壬: "申", 癸: "申",
};

const BOKSEONG_GWIIN_BY_DAY_STEM: Record<string, string> = {
  甲: "寅", 乙: "丑", 丙: "子", 丁: "酉", 戊: "申",
  己: "未", 庚: "午", 辛: "巳", 壬: "辰", 癸: "卯",
};

const JEONGGWAN_BY_DAY_STEM: Readonly<Record<string, string>> = {
  甲: "辛", 乙: "庚", 丙: "癸", 丁: "壬", 戊: "乙",
  己: "甲", 庚: "丁", 辛: "丙", 壬: "己", 癸: "戊",
};

const AMROK_BY_DAY_STEM: Record<string, string> = {
  甲: "亥", 乙: "戌", 丙: "申", 丁: "未", 戊: "申",
  己: "未", 庚: "巳", 辛: "辰", 壬: "寅", 癸: "丑",
};

const GEUMYEO_BY_DAY_STEM: Record<string, string> = {
  甲: "辰", 乙: "巳", 丙: "未", 丁: "申", 戊: "未",
  己: "申", 庚: "戌", 辛: "亥", 壬: "丑", 癸: "寅",
};

const BIIN_BY_DAY_STEM: Record<string, string> = {
  甲: "酉", 乙: "戌", 丙: "子", 丁: "丑", 戊: "子",
  己: "丑", 庚: "卯", 辛: "辰", 壬: "午", 癸: "未",
};

const HYEONCHIM_STEMS = new Set(["甲", "辛"]);
const HYEONCHIM_BRANCHES = new Set(["卯", "午", "申"]);

const YANGIN_BY_DAY_STEM: Record<string, string> = {
  甲: "卯", 乙: "辰", 丙: "午", 丁: "未", 戊: "午",
  己: "未", 庚: "酉", 辛: "戌", 壬: "子", 癸: "丑",
};

const BAEKHO_GANJI_SET = new Set([
  "甲辰",
  "乙未",
  "丙戌",
  "丁丑",
  "戊辰",
  "壬戌",
  "癸丑",
]);

const NAKJEONG_BY_DAY_STEM: Record<string, string> = {
  甲: "巳", 乙: "子", 丙: "申", 丁: "戌", 戊: "卯",
  己: "巳", 庚: "子", 辛: "申", 壬: "戌", 癸: "卯",
};

const CHEONMUN_BRANCHES = new Set(["戌", "亥"]);

const HWANGEUN_DAESA_BY_MONTH_BRANCH: Readonly<Record<string, string>> = {
  寅: "戌", 卯: "丑", 辰: "寅", 巳: "巳",
  午: "酉", 未: "卯", 申: "子", 酉: "午",
  戌: "亥", 亥: "辰", 子: "申", 丑: "未",
};

const CHEONUI_SEONG_BY_MONTH_BRANCH: Readonly<Record<string, string>> = {
  子: "亥", 丑: "子", 寅: "丑", 卯: "寅",
  辰: "卯", 巳: "辰", 午: "巳", 未: "午",
  申: "未", 酉: "申", 戌: "酉", 亥: "戌",
};

const POSITIONS: PillarPosition[] = ["year", "month", "day", "hour"];

function findGroup(branch: string, table: Record<string, unknown>) {
  return Object.keys(table).find((group) => group.includes(branch));
}

/** Canonical 12-sal lookup shared by natal pillars and non-pillar timing facts. */
export function getCanonicalTwelveSalId(
  natalYearBranch: string,
  targetBranch: string,
): TwelveSalId | null {
  const group = findGroup(natalYearBranch, TWELVE_SAL_BY_YEAR_GROUP);
  return group ? TWELVE_SAL_BY_YEAR_GROUP[group][targetBranch] ?? null : null;
}

function calculateTwelveSal(context: SalContext, branch: string): TwelveSalId | null {
  return getCanonicalTwelveSalId(context.yearBranch, branch);
}

type SalPillar = { stem: string; branch: string };

function calculateCheonEulGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  const { branch } = pillar;
  return CHEONEUL_BY_DAY_STEM[context.dayStem]?.includes(branch) ? "cheon_eul_gwiin" : null;
}

function calculateCheonDeokGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  const rule = CHEONDEOK_BY_MONTH_BRANCH[context.monthBranch];
  return rule && pillar[rule.target] === rule.value ? "cheon_deok_gwiin" : null;
}

function calculateWolDeokGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  const group = findGroup(context.monthBranch, WOLDEOK_BY_MONTH_GROUP);
  return group && WOLDEOK_BY_MONTH_GROUP[group] === pillar.stem ? "wol_deok_gwiin" : null;
}

function calculateTaegeukGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return TAEGEUK_BY_DAY_STEM[context.dayStem]?.includes(pillar.branch) ? "taegeuk_gwiin" : null;
}

function calculateMungokGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return MUNGOK_BY_DAY_STEM[context.dayStem] === pillar.branch ? "mungok_gwiin" : null;
}

function calculateMunchangGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return MUNCHANG_BY_DAY_STEM[context.dayStem] === pillar.branch ? "munchang_gwiin" : null;
}

function calculateCheonjuGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return CHEONJU_GWIIN_BY_DAY_STEM[context.dayStem] === pillar.branch ? "cheonju_gwiin" : null;
}

function calculateGwangwiHakgwan(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return GWANGWI_HAKGWAN_BY_DAY_STEM[context.dayStem] === pillar.branch ? "gwangwi_hakgwan" : null;
}

function calculateHakdangGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return BONG_START_BRANCH[context.dayStem] === pillar.branch
    ? "hakdang_gwiin"
    : null;
}

function calculateBokseongGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return BOKSEONG_GWIIN_BY_DAY_STEM[context.dayStem] === pillar.branch
    ? "bokseong_gwiin"
    : null;
}

/** 정관 천간의 canonical 건록지를 천복귀인 target으로 사용한다. */
export function getCheonbokGwiinBranch(dayStem: string): string | undefined {
  const jeonggwanStem = JEONGGWAN_BY_DAY_STEM[dayStem];
  return jeonggwanStem ? getGeonrokBranch(jeonggwanStem) : undefined;
}

function calculateCheonbokGwiin(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return getCheonbokGwiinBranch(context.dayStem) === pillar.branch
    ? "cheonbok_gwiin"
    : null;
}

function calculateHyeoprok(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  const geonrokBranch = getGeonrokBranch(context.dayStem);
  return geonrokBranch && getAdjacentBranches(geonrokBranch).includes(pillar.branch)
    ? "hyeoprok"
    : null;
}

function calculateAmrok(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return AMROK_BY_DAY_STEM[context.dayStem] === pillar.branch ? "amrok" : null;
}

function calculateGeumyeo(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return GEUMYEO_BY_DAY_STEM[context.dayStem] === pillar.branch ? "geumyeo" : null;
}

function calculateBiinSal(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return BIIN_BY_DAY_STEM[context.dayStem] === pillar.branch ? "biin_sal" : null;
}

function calculateHyeonchimSal(_context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return HYEONCHIM_STEMS.has(pillar.stem) || HYEONCHIM_BRANCHES.has(pillar.branch)
    ? "hyeonchim_sal"
    : null;
}

function calculateYanginSal(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return YANGIN_BY_DAY_STEM[context.dayStem] === pillar.branch ? "yangin_sal" : null;
}

function calculateBaekhoDaesal(_context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return BAEKHO_GANJI_SET.has(`${pillar.stem}${pillar.branch}`)
    ? "baekho_daesal"
    : null;
}

function calculateNakjeongGwansal(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return NAKJEONG_BY_DAY_STEM[context.dayStem] === pillar.branch
    ? "nakjeong_gwansal"
    : null;
}

function calculateCheonmunSeong(_context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return CHEONMUN_BRANCHES.has(pillar.branch) ? "cheonmun_seong" : null;
}

function calculateHwangeunDaesa(
  context: SalContext,
  pillar: SalPillar,
  position: PillarPosition,
): SpecialSalId | null {
  if (position !== "day" && position !== "hour") return null;
  return HWANGEUN_DAESA_BY_MONTH_BRANCH[context.monthBranch] === pillar.branch
    ? "hwangeun_daesa"
    : null;
}

function calculateCheonuiSeong(
  context: SalContext,
  pillar: SalPillar,
  position: PillarPosition,
): SpecialSalId | null {
  if (position === "month") return null;
  return CHEONUI_SEONG_BY_MONTH_BRANCH[context.monthBranch] === pillar.branch
    ? "cheonui_seong"
    : null;
}

const GORAN_PILLARS = new Set(["甲寅", "乙巳", "丁巳", "戊申", "辛亥"]);

const GWASUK_BY_YEAR_BRANCH: Record<string, string> = {
  子: "戌", 丑: "戌", 寅: "丑", 卯: "丑", 辰: "丑", 巳: "辰",
  午: "辰", 未: "辰", 申: "未", 酉: "未", 戌: "未", 亥: "戌",
};

function calculateGoranSal(_context: SalContext, pillar: SalPillar): SpecialSalId | null {
  return GORAN_PILLARS.has(`${pillar.stem}${pillar.branch}`) ? "goran_sal" : null;
}

function calculateGwasukSal(
  context: SalContext,
  pillar: SalPillar,
  position: PillarPosition,
): SpecialSalId | null {
  if (position === "year") return null;
  return GWASUK_BY_YEAR_BRANCH[context.yearBranch] === pillar.branch
    ? "gwasuk_sal"
    : null;
}

function calculateDohwaSal(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  const { branch } = pillar;
  const group = findGroup(context.dayBranch, DOHWA_BY_DAY_GROUP);
  return group && DOHWA_BY_DAY_GROUP[group] === branch ? "dohwa_sal" : null;
}

function calculateYeokmaSal(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  const { branch } = pillar;
  const group = findGroup(context.dayBranch, YEOKMA_BY_DAY_GROUP);
  return group && YEOKMA_BY_DAY_GROUP[group] === branch ? "yeokma_sal" : null;
}

function calculateHwagaeSal(context: SalContext, pillar: SalPillar): SpecialSalId | null {
  const { branch } = pillar;
  const group = findGroup(context.dayBranch, HWAGAE_BY_DAY_GROUP);
  return group && HWAGAE_BY_DAY_GROUP[group] === branch ? "hwagae_sal" : null;
}

const SPECIAL_SAL_CALCULATORS = [
  calculateCheonEulGwiin,
  calculateCheonDeokGwiin,
  calculateWolDeokGwiin,
  calculateTaegeukGwiin,
  calculateMungokGwiin,
  calculateMunchangGwiin,
  calculateCheonjuGwiin,
  calculateGwangwiHakgwan,
  calculateHakdangGwiin,
  calculateBokseongGwiin,
  calculateCheonbokGwiin,
  calculateAmrok,
  calculateGeumyeo,
  calculateHyeoprok,
  calculateBiinSal,
  calculateHyeonchimSal,
  calculateYanginSal,
  calculateBaekhoDaesal,
  calculateNakjeongGwansal,
  calculateDohwaSal,
  calculateYeokmaSal,
  calculateHwagaeSal,
  calculateCheonmunSeong,
  calculateHwangeunDaesa,
  calculateCheonuiSeong,
  calculateGoranSal,
  calculateGwasukSal,
] as const;

function calculateSpecialSals(
  context: SalContext,
  pillar: SalPillar,
  position: PillarPosition,
): SalResult[] {
  const ids = SPECIAL_SAL_CALCULATORS
    .map((calculator) => calculator(context, pillar, position))
    .filter((id): id is SpecialSalId => id !== null);

  return [...new Set(ids)]
    .map((id) => SAL_DEFINITIONS[id])
    .sort((left, right) => left.displayOrder - right.displayOrder);
}

export function calculateCanonicalSals({
  pillars,
  bongStages,
  birthTimeUnknown = false,
  relationSals = [],
}: CanonicalSalInput): CanonicalSals {
  const context: SalContext = {
    yearBranch: pillars.year.branch,
    monthBranch: pillars.month.branch,
    dayBranch: pillars.day.branch,
    dayStem: pillars.day.stem,
  };

  return Object.fromEntries(POSITIONS.map((position) => {
    if (position === "hour" && birthTimeUnknown) {
      return [position, {
        twelveSal: "", specialSals: [], twelveSalId: null, sals: [],
      }];
    }

    const pillar = pillars[position];
    const branch = pillar.branch;
    const twelveSalId = calculateTwelveSal(context, branch);
    const calculatedSals = calculateSpecialSals(context, pillar, position);
    const projectedRelationSals = relationSals
      .filter((relation) => relation.from === position || relation.to === position)
      .map((relation) => SAL_DEFINITIONS[relation.id]);
    const sals = [...new Map([
      ...(bongStages?.[position] === "건록" ? [SAL_DEFINITIONS.geonrok] : []),
      ...calculatedSals,
      ...projectedRelationSals,
    ].map((sal) => [sal.id, sal] as const)).values()]
      .sort((left, right) => left.displayOrder - right.displayOrder);

    return [position, {
      twelveSal: twelveSalId ? SAL_DEFINITIONS[twelveSalId].name : "",
      specialSals: sals.map((sal) => sal.name),
      twelveSalId,
      sals,
    }];
  })) as CanonicalSals;
}
