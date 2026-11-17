"use client";

import { useEffect, useState } from "react";

import SajuDashboard from "../../components/saju/SajuDashboard";
import type { UnlogUser } from "../../lib/user";

const dashboardPreviewUser: UnlogUser = {
  name: "나",
  birthDate: "2000-01-01",
  birthHour: 12,
  birthMinute: 0,
  calendarType: "solar",
  gender: "female",
};

export default function SajuPage() {
  const [savedUser, setSavedUser] = useState<UnlogUser>(dashboardPreviewUser);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("unlog-user");
      if (savedProfile) {
        const user = JSON.parse(savedProfile) as UnlogUser;
        queueMicrotask(() => setSavedUser(user));
      }
    } catch (error) {
      console.error("저장된 사주 정보를 불러오지 못했어요.", error);
    }
  }, []);

  return (
    <SajuDashboard
      user={savedUser}
      bannerImage="/image/saju/saju-story-banner-v9.png"
    />
  );
}
