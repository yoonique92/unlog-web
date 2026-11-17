"use client";

import Link from "next/link";
import { Gem } from "lucide-react";
import { usePathname } from "next/navigation";

import { useStoneWalletBalance } from "../../lib/stones/useStoneWalletBalance";

export default function MobileHeader() {
  const pathname = usePathname();
  const { walletBalance, status: walletStatus } =
    useStoneWalletBalance(pathname);
  const showWalletBalance = walletStatus === "ready";

  return (
    <header className="relative z-50 w-full shrink-0 border-b border-[#D8D2F3] bg-white/90 backdrop-blur-md">
      <div className="flex h-[56px] items-center justify-between px-5">

        {/* 왼쪽 로고 */}
        <Link href="/" className="block">
          <div>
            <p className="text-[20px] font-extrabold tracking-tight text-[#181450]">
              운로그 ✦
            </p>

            <p className="mt-[-3px] text-[8px] font-bold tracking-[0.35em] text-[#181450]">
              UNLOG
            </p>
          </div>
        </Link>

        {/* 오른쪽 영역 */}
        <div className="flex items-center gap-[10px]">

          {/* 로그 상점 */}
          <Link
            href="/charge"
            aria-label={
              showWalletBalance
                ? `로그 상점, 보유 운석 ${walletBalance}개`
                : "로그 상점"
            }
            className={`flex h-[36px] items-center justify-center text-[#6656C9] ${
              showWalletBalance
                ? "gap-1 px-1"
                : "w-[36px]"
            }`}
          >
            <Gem
              size={21}
              strokeWidth={1.8}
              className="text-[#6656C9]"
            />
            {showWalletBalance && (
              <span className="text-[12px] font-extrabold leading-none">
                {walletBalance}
              </span>
            )}
          </Link>

          {/* 프로필 */}
          <Link
            href="/my"
            aria-label="프로필"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#D8D2F3] bg-white text-[10px] font-bold text-[#6656C9]"
          >
            MY
          </Link>

        </div>
      </div>
    </header>
  );
}
