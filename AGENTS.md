<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 운로그 사이트 공통 개발 원칙

이 지침은 홈, 로그프렌즈, 사주보기, 궁합보기, 로그상점, MY,
로그인/회원가입 및 앞으로 추가되는 모든 페이지와 기능에 적용한다.

## 1. 기기명이 아니라 레이아웃 조건을 해결한다

- 사용자가 특정 iPhone, Galaxy, PC 또는 viewport에서 발견한 문제를 말해도 그 기기만을 위한 요청으로 해석하지 않는다.
- 해당 화면은 재현 사례일 뿐이며, 같은 container/viewport 조건을 가진 모든 환경에서 원인이 해결되도록 구현한다.
- 기기 모델명, 특정 화면 폭·높이 한 값, 기기별 좌표·크기·애니메이션 분기를 추가하지 않는다.
- PC와 모바일 레이아웃을 의도적으로 다르게 설계한 기존 디자인은 유지하되, 각 환경군에서는 동일한 규칙을 사용한다.

## 2. 반응형 레이아웃 기준

- 우선순위는 실제 container width/height, available space, aspect-ratio, CSS Grid/Flexbox, `clamp()`, `min()`, `max()`, container query, 공통 design token 순이다.
- 특정 viewport 숫자에 맞춘 보정값을 누적하지 않는다. 폭/높이 breakpoint가 필요하면 기기명이 아닌 실제 레이아웃이 바뀌어야 하는 일반적인 경계로 정의한다.
- 관련 요소가 하나의 장면이나 그룹이면 동일한 container 좌표계와 공통 비례 규칙을 사용한다.
- 세로로 길거나 짧은 화면에서도 요소별 예외 좌표를 만들기보다 container의 실제 크기와 제약으로 자연스럽게 배치한다.

## 3. 기능 로직은 공통으로 유지한다

- 버튼, 이동, 결과 표시, 친구, 궁합, 결제, 상태 전환 등의 기능 코드 경로는 PC와 모바일에서 최대한 공유한다.
- 반응형 UI 배치는 달라질 수 있지만 동일 기능의 상태와 결과가 환경에 따라 달라지지 않게 한다.
- 플랫폼 차이가 꼭 필요한 경우 실제 플랫폼 제약을 확인하고 영향 범위를 사용자에게 먼저 알린다.

## 4. 애니메이션 원칙

- 동일 component의 duration, easing, transition 방식과 sequence는 모든 환경에서 공통으로 사용한다.
- 성능 문제를 기기별 timing 변경으로 덮지 않는다. preload/decode, mount/unmount 시점, 불필요한 rerender, layout/repaint, asset 크기, browser bottleneck을 먼저 진단한다.
- `prefers-reduced-motion` 같은 접근성 설정은 공통 동작의 명시적인 예외로 지원한다.
- 홈 캐릭터 crossfade를 수정할 때도 공통 sequence와 preload를 유지하고 기기별 애니메이션 분기를 만들지 않는다.

## 5. 이미지 선명도와 합성

- 반응형 레이아웃을 위해 AppShell, 전체 Scene 또는 전체 Canvas에 `transform: scale()`, `zoom`, `translateZ(0)`을 적용하지 않는다.
- 불필요한 GPU 강제 합성 및 장시간 `will-change` 사용을 피한다.
- 실제 CSS `width`, `height`, `left`, `top`, `inset`, Grid/Flex 크기로 배치한다.
- 투명 PNG를 다룰 때는 원본 해상도, alpha bounding box, 실제 rendered size와 fractional pixel 여부를 확인한다.

## 6. 공통 컴포넌트와 디자인 시스템

- Header, BottomNavigation, AppShell, 버튼, 카드, 타이포그래피 등 공통 UI는 공유 component/style/token을 우선한다.
- 동일 UI를 페이지별로 복제하지 않는다.
- 공통 component 수정이 다른 페이지에 영향을 준다면 구현 전에 영향 범위를 알리고, 영향받는 대표 페이지를 함께 검증한다.

## 7. 최소 변경 범위

- 사용자가 지정한 요소와 직접 필요한 코드만 수정한다. 관련 없는 배경, 캐릭터, 버튼, navigation, 다른 페이지를 함께 변경하지 않는다.
- 기존 dirty worktree와 사용자 변경을 보존한다.
- 공통 코드 변경이 불가피하면 먼저 현재 구조와 파급 범위를 확인하고 최소 범위로 적용한다.
- 요청하지 않은 디자인 통일이나 리팩터링을 끼워 넣지 않는다.

## 8. 회귀 방지 및 검증

- 수정 전 실제 적용 요소, computed/layout 기준, 스타일 우선순위와 직접 원인을 확인한다.
- 수정 후 모바일의 작은·중간·큰 container와 PC의 노트북·데스크톱·큰 viewport를 대표 조건으로 검증한다.
- 특정 기기와 픽셀 일치를 목표로 하지 않고 동일한 규칙이 서로 다른 조건에서 안정적으로 작동하는지 확인한다.
- 관련 범위에 맞춰 TypeScript, ESLint 및 필요한 UI/브라우저 검증을 실행한다.
- 최종 보고에는 변경 파일, 변경 규칙, 영향 범위, 검증 결과와 의도적으로 변경하지 않은 영역을 명시한다.

## 작업 판단의 핵심

특정 기기에서 보고된 문제는 운로그 전체 반응형 시스템에서 드러난 증상으로 취급한다.
기기별 예외를 추가하지 말고 공통 구조와 공통 규칙의 원인을 해결한다. 단, 이미 의도적으로 분리된 PC/모바일 디자인과 기능 의도는 보존한다.
