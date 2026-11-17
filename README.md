This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### 운로그 Production 필수 설정

운로그의 사용자용 신강·신약 공식은 Candidate D (`D_FROZEN_V1`)를 사용한다.

Production 배포 전에 반드시 Production 환경변수에 다음 값을 설정한다.

```env
NEXT_PUBLIC_UNLOG_STRENGTH_D_PRODUCTION_V1=true
```

이 변수는 `NEXT_PUBLIC` 환경변수이므로 설정을 변경한 뒤에는 반드시 새로운 production build와 재배포가 필요하다. 기존 빌드의 런타임 환경변수만 변경해서는 적용되지 않는다.

배포 체크리스트:

1. Production 환경변수 `NEXT_PUBLIC_UNLOG_STRENGTH_D_PRODUCTION_V1=true` 확인
2. 새로운 production build 실행
3. 새 빌드 재배포
4. 배포 후 `advanced.dayStrength`가 Candidate D (`D_FROZEN_V1`) 결과를 사용하는지 smoke test

이 설정이 누락되거나 `true`가 아니면 기존 ssaju 신강·신약 값으로 동작한다. Candidate D 계산 오류 시 기존 ssaju `dayStrength`로 복귀하는 fallback은 별도로 유지된다.

## GitHub Pages 정적 버전

Node.js 24에서 아래 명령을 실행하면 '/unlog-web/' 경로용 정적 파일이 'out/'에 생성됩니다.

    npm ci
    node scripts/build-pages.mjs

이 빌드는 홈에서 운세 뽑기, 오늘의 운세, 사주와 궁합을 제공합니다. MY에서 입력한 사주 정보는 브라우저에 저장됩니다. 로그인, 친구 초대, 결제, 신년운세 등은 서버가 필요합니다.

'out/'의 내용 전체와 '.nojekyll'을 'gh-pages' 브랜치 루트에 올린 후 GitHub 저장소의 Settings → Pages에서 Deploy from a branch, gh-pages, /(root)를 선택합니다.

DB 마이그레이션은 소스에 포함됩니다. 실행 환경의 비밀값과 사용자 데이터는 별도로 설정합니다.