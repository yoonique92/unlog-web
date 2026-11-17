"use client";

import { useEffect, useState } from "react";

export default function TestPage() {
  const [count, setCount] =
    useState(0);

  const [status, setStatus] =
    useState("JS 연결 확인 중...");

  useEffect(() => {
    setStatus("JS 연결됨 ✅");
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <h1 className="text-[24px] font-bold text-black">
        모바일 테스트
      </h1>

      <div className="mt-6 rounded-[20px] bg-gray-100 p-5">
        <p className="text-[18px] font-bold text-black">
          {status}
        </p>

        <p className="mt-4 text-[16px] text-black">
          클릭 횟수: {count}
        </p>

        <button
          type="button"
          onClick={() => {
            setCount(
              (prev) => prev + 1
            );
          }}
          className="mt-5 rounded-full bg-purple-600 px-6 py-3 text-[16px] font-bold text-white"
        >
          버튼 눌러보기
        </button>
      </div>
    </main>
  );
}