import type { FiveElement } from "../saju/types";
import type { Finding, GeukgukAnalysis, JohuAnalysis, StrengthAnalysis, TimelineFinding, YongsinAnalysis } from "../myeongri/types";

export interface ReadingContext {
  profile: {
    dayMaster: { stem: string; element: FiveElement; yinYang: "yin" | "yang" };
    season: "spring" | "summer" | "autumn" | "winter";
    pillars: { year: string; month: string; day: string; hour?: string };
    tenGods: string[];
    daeunGanzhi?: string;
    targetSeyunGanzhi?: string;
  };
  strength: StrengthAnalysis;
  johu: JohuAnalysis;
  geukguk: GeukgukAnalysis;
  yongsin: YongsinAnalysis;
  topNatalFindings: Finding[];
  timelineFindings: TimelineFinding[];
  constraints: {
    geukgukStatus: GeukgukAnalysis["status"];
    yongsinStatus: YongsinAnalysis["status"];
    sinsalProvided: false;
    candidateLanguageOnly: true;
    medicalPredictionAllowed: false;
  };
}

export interface ReadingSection {
  findingId: string;
  title: string;
  body: string;
}

export interface StructuredReadingResponse {
  sections: ReadingSection[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  sectionIndex?: number;
}

export interface ReadingValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
