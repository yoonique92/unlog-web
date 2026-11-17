export type UnlogUser = {
  name: string;
  birthDate: string;
  birthHour: number;
  birthMinute: number;
  birthTimeUnknown?: boolean;
  calendarType: "solar" | "lunar";
  gender: "male" | "female";
};

export const guestUser = {
  name: "비회원",
};
