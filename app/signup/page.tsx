"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const connectionId =
    searchParams.get("connectionId");

  const handleKakaoSignup = () => {
    const params = new URLSearchParams();

    if (connectionId) {
      params.set("connectionId", connectionId);
    }

    const query = params.toString();
    window.location.href = query
      ? `/api/auth/kakao?${query}`
      : "/api/auth/kakao";
  };

  const handleNaverSignup = () => {
    const params = new URLSearchParams();
    if (connectionId) params.set("connectionId", connectionId);

    const query = params.toString();
    window.location.href = query
      ? `/api/auth/naver?${query}`
      : "/api/auth/naver";
  };

  const handleGoogleSignup = () => {
    const params = new URLSearchParams();
    if (connectionId) params.set("connectionId", connectionId);

    const query = params.toString();
    window.location.href = query
      ? `/api/auth/google?${query}`
      : "/api/auth/google";
  };

  return (
    <main
      className="
        flex
        min-h-full
        items-center
        justify-center
        bg-[#F5F2FF]
        px-5
        py-10
      "
    >
      <div
        className="
          w-full
          max-w-[390px]
        "
      >
        {/* ========================================
            상단
        ======================================== */}

        <div className="text-center">
          <p
            className="
              text-[13px]
              font-bold
              text-[#8A7BBC]
            "
          >
            운로그
          </p>

          <h1
            className="
              mt-2
              text-[26px]
              font-extrabold
              tracking-[-0.04em]
              text-[#241B63]
            "
          >
            운로그 시작하기
          </h1>

          <p
            className="
              mt-3
              break-keep
              text-[14px]
              font-medium
              leading-[1.7]
              text-[#918B99]
            "
          >
            내 캐릭터를 저장하고
            <br />
            나만의 로그 프렌즈를 만들어보세요
          </p>
        </div>

        {/* ========================================
            가입 카드
        ======================================== */}

        <div
          className="
            mt-8
            rounded-[28px]
            bg-white
            px-5
            pb-6
            pt-6
            shadow-[0_10px_30px_rgba(77,60,138,0.08)]
          "
        >
          {/* ========================================
              카카오
          ======================================== */}

          <button
            type="button"
            onClick={handleKakaoSignup}
            className="
              flex
              w-full
              items-center
              justify-center
              rounded-[15px]
              bg-[#FEE500]
              px-4
              py-[14px]
              text-[15px]
              font-extrabold
              tracking-[-0.02em]
              text-[#191919]
              transition
              active:scale-[0.98]
            "
          >
            카카오톡으로 시작하기
          </button>

          {/* ========================================
              네이버
          ======================================== */}

          <button
            type="button"
            onClick={handleNaverSignup}
            className="
              mt-3
              flex
              w-full
              items-center
              justify-center
              rounded-[15px]
              bg-[#03C75A]
              px-4
              py-[14px]
              text-[15px]
              font-extrabold
              tracking-[-0.02em]
              text-white
              transition
              active:scale-[0.98]
            "
          >
            네이버로 시작하기
          </button>

          {/* ========================================
              구글
          ======================================== */}

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="
              mt-3
              flex
              w-full
              items-center
              justify-center
              rounded-[15px]
              border
              border-[#E6E1EC]
              bg-white
              px-4
              py-[14px]
              text-[15px]
              font-extrabold
              tracking-[-0.02em]
              text-[#393344]
              transition
              active:scale-[0.98]
            "
          >
            Google로 시작하기
          </button>

          {/* ========================================
              로그인
          ======================================== */}

          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams();
              if (connectionId) params.set("connectionId", connectionId);

              const query = params.toString();
              router.push(query ? `/login?${query}` : "/login");
            }}
            className="
              mt-5
              w-full
              py-2
              text-center
              text-[13px]
              font-medium
              text-[#918B99]
            "
          >
            이미 계정이 있나요?{" "}
            <span
              className="
                font-bold
                text-[#654AE7]
              "
            >
              로그인
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
