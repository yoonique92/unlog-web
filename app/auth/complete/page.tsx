"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SocialLoginCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("로그인 중입니다. 잠시만 기다려주세요.");

  useEffect(() => {
    async function completeLogin() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !data?.user?.id) {
          throw new Error(data?.error || "사용자 정보를 확인하지 못했습니다.");
        }

        localStorage.setItem("unlog-user-id", data.user.id);
        localStorage.setItem(
          "unlog-account",
          JSON.stringify({
            id: data.user.id,
            name: data.user.name,
            provider: data.user.provider,
          })
        );

        const connectionId = searchParams.get("connectionId");
        if (connectionId) {
          const connectResponse = await fetch("/api/friends/connect-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connectionId }),
          });

          if (!connectResponse.ok) {
            setMessage("로그인은 완료됐지만 친구 연결에 문제가 생겼어요.");
            return;
          }
        }

        if (data.user.sajuProfile) {
          localStorage.setItem(
            "unlog-user",
            JSON.stringify({
              name: data.user.name,
              ...data.user.sajuProfile,
            })
          );
          router.replace("/");
          return;
        }

        router.replace("/onboarding/saju");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "로그인을 완료하지 못했습니다."
        );
      }
    }

    void completeLogin();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F2FF] px-5">
      <div className="rounded-[24px] bg-white px-8 py-10 text-center shadow-[0_10px_30px_rgba(77,60,138,0.08)]">
        <p className="text-[15px] font-bold text-[#6048C8]">{message}</p>
      </div>
    </main>
  );
}
