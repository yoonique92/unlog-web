export const MAX_NICKNAME_LENGTH = 6;

export function limitNickname(value: string) {
  return Array.from(value.trim()).slice(0, MAX_NICKNAME_LENGTH).join("");
}

export function isNicknameWithinLimit(value: string) {
  return Array.from(value.trim()).length <= MAX_NICKNAME_LENGTH;
}
