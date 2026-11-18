"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BirthDateInput, {
  isValidBirthDate,
} from "../../../components/BirthDateInput";

type CalendarType = "solar" | "lunar";
type Gender = "female" | "male";

export default function SajuOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthHour, setBirthHour] = useState("");
  const [birthMinute, setBirthMinute] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [gender, setGender] = useState<Gender | "">("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (!isValidBirthDate(birthDate)) {
      alert("생년월일을 올바르게 입력해주세요.");
      return;
    }

    const hour = birthTimeUnknown ? 12 : Number(birthHour);
    const minute = birthTimeUnknown ? 0 : Number(birthMinute);
    if (
      !birthTimeUnknown &&
      (birthHour === "" ||
        birthMinute === "" ||
        !Number.isInteger(hour) ||
        hour < 0 ||
        hour > 23 ||
        !Number.isInteger(minute) ||
        minute < 0 ||
        minute > 59)
    ) {
      alert("태어난 시간을 올바르게 입력해주세요.");
      return;
    }

    if (!gender) {
      alert("성별을 선택해주세요.");
      return;
    }

    try {
      setSaving(true);
      const profile = {
        name: name.trim(),
        birthDate,
        birthHour: hour,
        birthMinute: minute,
        birthTimeUnknown,
        calendarType,
        gender,
      };

      if (process.env.NEXT_PUBLIC_UNLOG_PAGES !== "true") {
        const response = await fetch("/api/users/saju", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data?.error || "사주 정보를 저장하지 못했습니다.");
        }

        const account = JSON.parse(localStorage.getItem("unlog-account") ?? "null");
        localStorage.setItem(
          "unlog-account",
          JSON.stringify({ ...account, name: profile.name })
        );
      }

      localStorage.setItem("unlog-user", JSON.stringify(profile));
      router.replace("/");
      if (process.env.NEXT_PUBLIC_UNLOG_PAGES !== "true") router.refresh();
    } catch (error) {
      console.error("가입 사주 정보 저장 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "사주 정보를 저장하지 못했습니다."
      );
      setSaving(false);
    }
  };

  const optionClass = (selected: boolean) =>
    `rounded-[14px] border py-[11px] text-[14px] font-bold transition ${
      selected
        ? "border-[#7659E6] bg-[#F0EBFF] text-[#6045D0]"
        : "border-[#E5E0F2] bg-[#FAF9FD] text-[#77717E]"
    }`;

  const calendarOptionClass = (selected: boolean) =>
    `rounded-[14px] border py-[11px] text-[14px] font-bold ${
      selected
        ? "border-[#7659E6] bg-[#F0EBFF] text-[#6045D0]"
        : "border-[#E5E0F2] bg-[#FAF9FD] text-[#77717E]"
    }`;

  return (
    <main className="min-h-full bg-[#F5F2FF] px-5 py-10">
      <div className="mx-auto w-full max-w-[390px]">
        <div className="text-center">
          <p className="text-[13px] font-bold text-[#8A7BBC]">운로그</p>
          <h1 className="mt-2 text-[25px] font-extrabold tracking-[-0.04em] text-[#241B63]">
            나의 오늘부터 우리 사이까지
          </h1>
          <p className="mt-3 text-[14px] font-medium leading-[1.7] text-[#918B99]">
            매일 달라지는 나의 운과
            <br />함께라서 더 궁금한 우리 사이를 만나보세요
          </p>
        </div>

        <section className="mt-7 rounded-[26px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(77,60,138,0.08)]">
          <label className="text-[13px] font-bold text-[#393344]">이름</label>
          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(Array.from(event.target.value).slice(0, 6).join(""))
            }
            maxLength={6}
            placeholder="이름을 입력해주세요"
            className="mt-2 w-full rounded-[14px] border border-[#E5E0F2] bg-[#FAF9FD] px-4 py-[12px] text-[15px] outline-none focus:border-[#8068E7]"
          />

          <label className="mt-5 block text-[13px] font-bold text-[#393344]">생년월일</label>
          <BirthDateInput className="mt-2" onChange={setBirthDate} />

          <div className="mt-5 flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#393344]">
              태어난 시간
            </label>
            <button
              type="button"
              onClick={() => {
                setBirthTimeUnknown((previous) => !previous);
                setBirthHour("");
                setBirthMinute("");
              }}
              className={`rounded-full border px-3 py-1 text-[12px] font-bold transition ${
                birthTimeUnknown
                  ? "border-[#654AE7] bg-[#654AE7] text-white"
                  : "border-[#D8D2E7] bg-white text-[#918B99]"
              }`}
            >
              모름
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="23"
              placeholder="시"
              value={birthHour}
              disabled={birthTimeUnknown}
              onChange={(event) => setBirthHour(event.target.value)}
              className="rounded-[14px] border border-[#E5E0F2] bg-[#FAF9FD] px-4 py-[12px] text-center text-[15px] outline-none focus:border-[#8068E7] disabled:cursor-not-allowed disabled:bg-[#EFEDF3] disabled:text-[#B8B3BF]"
            />
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="59"
              placeholder="분"
              value={birthMinute}
              disabled={birthTimeUnknown}
              onChange={(event) => setBirthMinute(event.target.value)}
              className="rounded-[14px] border border-[#E5E0F2] bg-[#FAF9FD] px-4 py-[12px] text-center text-[15px] outline-none focus:border-[#8068E7] disabled:cursor-not-allowed disabled:bg-[#EFEDF3] disabled:text-[#B8B3BF]"
            />
          </div>

          <p className="mt-5 text-[13px] font-bold text-[#393344]">달력 기준</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCalendarType("solar")}
              className={calendarOptionClass(calendarType === "solar")}
            >
              양력
            </button>
            <button
              type="button"
              onClick={() => setCalendarType("lunar")}
              className={calendarOptionClass(calendarType === "lunar")}
            >
              음력
            </button>
          </div>

          <p className="mt-5 text-[13px] font-bold text-[#393344]">성별</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender("female")}
              className={optionClass(gender === "female")}
            >
              여성
            </button>
            <button
              type="button"
              onClick={() => setGender("male")}
              className={optionClass(gender === "male")}
            >
              남성
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="mt-7 w-full rounded-[15px] bg-[#654AE7] py-[14px] text-[15px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "저장 중" : "운로그 시작하기"}
          </button>
        </section>
      </div>
    </main>
  );
}
