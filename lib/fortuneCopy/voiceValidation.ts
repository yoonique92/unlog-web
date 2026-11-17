import {
  UNLOG_FORTUNE_VOICE_POLICY,
  type FortuneCopyContentKind,
} from "./voicePolicy";

export type FortuneVoiceIssueCode =
  | "repeated_ending"
  | "formal_only_paragraph"
  | "casual_only_paragraph"
  | "abstract_language_overuse"
  | "strong_directive"
  | "deterministic_event"
  | "duplicate_sentence"
  | "connective_goyo"
  | "monthly_headline_tone";

export type FortuneVoiceIssue = {
  readonly code: FortuneVoiceIssueCode;
  readonly message: string;
  readonly excerpt?: string;
};

export type FortuneVoiceValidationOptions = {
  readonly contentKind: FortuneCopyContentKind;
  /** Strict checks are opt-in so the validator stays a guardrail, not a writer. */
  readonly checkParagraphTone?: boolean;
  readonly checkAbstractLanguage?: boolean;
};

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?。！？])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function sentenceEnding(sentence: string) {
  const normalized = sentence.replace(/[.!?。！？]+$/u, "").trim();
  return normalized.match(/(니다|해요|돼요|있어요|없어요|좋아요|이고요|고요)$/u)?.[1] ?? null;
}

function hasThreeRepeatedEndings(sentences: readonly string[]) {
  const endings = sentences.map(sentenceEnding);
  return endings.some(
    (ending, index) =>
      ending !== null &&
      ending === endings[index + 1] &&
      ending === endings[index + 2]
  );
}

function countTerm(text: string, term: string) {
  return text.split(term).length - 1;
}

function isFormalEnding(ending: string | null) {
  return ending === "니다";
}

function isCasualEnding(ending: string | null) {
  return ending !== null && /(?:해요|돼요|있어요|없어요|좋아요|이고요|고요)$/u.test(ending);
}

export function validateFortuneVoice(
  text: string,
  options: FortuneVoiceValidationOptions
): FortuneVoiceIssue[] {
  const issues: FortuneVoiceIssue[] = [];
  const sentences = splitSentences(text);

  if (hasThreeRepeatedEndings(sentences)) {
    issues.push({
      code: "repeated_ending",
      message: "같은 종결이 세 문장 이상 연속으로 반복됩니다.",
    });
  }

  if (options.checkParagraphTone && sentences.length >= 3) {
    const endings = sentences.map(sentenceEnding).filter(Boolean);
    if (endings.length >= 3 && endings.every(isFormalEnding)) {
      issues.push({
        code: "formal_only_paragraph",
        message: "문단 전체가 보고서형 종결로만 이어집니다.",
      });
    }
    if (endings.length >= 3 && endings.every(isCasualEnding)) {
      issues.push({
        code: "casual_only_paragraph",
        message: "문단 전체가 해요체 종결로만 이어집니다.",
      });
    }
  }

  if (options.checkAbstractLanguage) {
    const repeated = UNLOG_FORTUNE_VOICE_POLICY.abstractTerms.filter(
      (term) => countTerm(text, term) >= 3
    );
    if (repeated.length > 0) {
      issues.push({
        code: "abstract_language_overuse",
        message: `추상어가 한 문단에서 반복됩니다: ${repeated.join(", ")}`,
      });
    }
  }

  const directive = UNLOG_FORTUNE_VOICE_POLICY.strongDirectiveTerms.find(
    (term) => text.includes(term)
  );
  if (directive) {
    issues.push({
      code: "strong_directive",
      message: "강한 명령 표현이 포함되어 있습니다.",
      excerpt: directive,
    });
  }

  const deterministicEvent =
    UNLOG_FORTUNE_VOICE_POLICY.deterministicEventPatterns.find((pattern) =>
      pattern.test(text)
    );
  if (deterministicEvent) {
    issues.push({
      code: "deterministic_event",
      message: "미래 사건을 확정적으로 표현하고 있습니다.",
      excerpt: text.match(deterministicEvent)?.[0],
    });
  }

  if (options.contentKind === "monthly_headline") {
    if (/^(?:이번 달|\d{1,2}월|운세)/u.test(text)) {
      issues.push({
        code: "monthly_headline_tone",
        message: "월별 headline에 월 이름이나 운세 요약 라벨을 넣지 않습니다.",
      });
    }
    if (/(?:하세요|해보세요|하십시오)[.!?]?$/u.test(text)) {
      issues.push({
        code: "monthly_headline_tone",
        message: "월별 headline은 행동 지시보다 생활 장면을 보여줘야 합니다.",
      });
    }
  }

  if (
    options.contentKind !== "monthly_headline" &&
    /(?:고요|되고요|커지고요|싶어지고요)[.!?]/u.test(text)
  ) {
    issues.push({
      code: "connective_goyo",
      message: "본문과 Tip에서는 대화형 ~고요 종결을 기본적으로 사용하지 않습니다.",
      excerpt: text.match(/[^.!?]*(?:고요|되고요|커지고요|싶어지고요)[.!?]/u)?.[0]?.trim(),
    });
  }

  return issues;
}

export function findDuplicateFortuneSentences(texts: readonly string[]) {
  const seen = new Map<string, number>();
  const duplicates = new Set<string>();

  texts.flatMap(splitSentences).forEach((sentence) => {
    const normalized = sentence.replace(/\s+/gu, " ").trim();
    const count = (seen.get(normalized) ?? 0) + 1;
    seen.set(normalized, count);
    if (count > 1) duplicates.add(normalized);
  });

  return [...duplicates];
}

