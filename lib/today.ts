import { getSaju } from "./saju";

function formatDateForSaju(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

export function getTodaySaju(customDate?: string) {
  const targetDate = customDate
    ? new Date(`${customDate}T12:00:00+09:00`)
    : new Date();

  const todayDate = formatDateForSaju(targetDate);

  // 오늘의 일주를 얻기 위해 정오 12시 기준으로 계산
  const result = getSaju(
    todayDate,
    "12",
    "0",
    "solar",
    "female"
  );

  const day = result.pillarDetails.day;

  return {
    date: todayDate,

    stem: day.stem,
    branch: day.branch,

    stemKo: day.stemKo,
    branchKo: day.branchKo,

    ganzhi: `${day.stem}${day.branch}`,
  };
}