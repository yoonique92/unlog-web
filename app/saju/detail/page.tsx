"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import type { UnlogUser } from "../../../lib/user";
import SajuManse from "../../../components/saju/SajuManse";

export default function SajuDetailPage() {
  const router = useRouter();
  const [user, setUser] = useState<UnlogUser | null>(null);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("unlog-user");
      if (!savedProfile) {
        router.replace("/saju");
        return;
      }
      setUser(JSON.parse(savedProfile) as UnlogUser);
    } catch {
      router.replace("/saju");
    }
  }, [router]);

  return (
    <main className="min-h-full bg-[#F5F2FF]">
      <div className="mx-auto min-h-full w-full bg-gradient-to-b from-[#E8E3FF] to-[#F8F7FC] pb-12">
        <header className="sticky top-0 z-30 flex h-[56px] items-center border-b border-[#E3DFF0] bg-white/95 px-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="사주보기로 돌아가기"
            className="flex h-9 w-9 items-center justify-center text-[#30286D]"
          >
            <ChevronLeft size={23} />
          </button>
          <h1 className="ml-1 text-[17px] font-extrabold text-[#20185B]">사주 풀이</h1>
        </header>

        <div className="px-5 pt-5">
          {user ? (
            <SajuManse user={user} />
          ) : (
            <div className="py-20 text-center text-[13px] font-medium text-[#8C8598]">
              사주 정보를 불러오고 있어요.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
