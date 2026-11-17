"use client";

import { useEffect, useMemo, useState } from "react";

import type { UnlogUser } from "../../lib/user";

export default function MyProfileBirthDate() {
  const [savedProfile, setSavedProfile] = useState<string | null>(null);

  useEffect(() => {
    const updateProfile = () => {
      setSavedProfile(localStorage.getItem("unlog-user"));
    };

    updateProfile();
    window.addEventListener("storage", updateProfile);
    return () => window.removeEventListener("storage", updateProfile);
  }, []);

  const birthDate = useMemo(() => {
    if (!savedProfile) return null;

    try {
      const user = JSON.parse(savedProfile) as UnlogUser;
      const [year, month, day] = user.birthDate.split("-").map(Number);
      if (!year || !month || !day) return null;

      const calendarLabel = user.calendarType === "lunar" ? "음력" : "양력";
      const timeLabel = user.birthTimeUnknown
        ? "시간 모름"
        : `${user.birthHour}시 ${String(user.birthMinute).padStart(2, "0")}분`;

      return `${year}. ${month}. ${day} (${calendarLabel})\n${timeLabel}`;
    } catch {
      return null;
    }
  }, [savedProfile]);

  const profileLabel = birthDate ?? "로그인 후\n내 정보 불러오기";

  return (
    <span className={`absolute left-1/2 top-[134px] -translate-x-1/2 whitespace-pre text-center font-medium leading-[1.45] tracking-[-0.03em] text-[#A6A3AC] sm:top-[126px] ${birthDate ? "text-[10px]" : "text-[11px] sm:text-[10px]"}`}>
      {profileLabel}
    </span>
  );
}
