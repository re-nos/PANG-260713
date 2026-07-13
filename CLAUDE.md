# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기술 스택

- **React 19** + **TypeScript** (strict 모드)
- **Vite 8** (빌드 도구, `@vitejs/plugin-react` 사용)
- **Oxlint** (린터, ESLint 대체 — `.oxlintrc.json`에서 설정)
- 패키지 매니저: npm (`package-lock.json` 존재)

## 명령어

```bash
npm install       # 의존성 설치
npm run dev       # 개발 서버 실행 (Vite, HMR 지원)
npm run build     # 타입 체크(tsc -b) 후 프로덕션 빌드
npm run preview   # 빌드 결과물 로컬 미리보기
npm run lint      # Oxlint 린트 실행
```

## 테스트

현재 이 저장소에는 테스트 프레임워크(Vitest/Jest 등)가 설정되어 있지 않으며 `package.json`에 test 스크립트도 없습니다. 테스트를 추가할 경우 Vite 생태계와 궁합이 좋은 **Vitest** 도입을 우선 고려하세요.

## 프로젝트 구조

- `src/main.tsx` — 진입점. `#root` DOM에 `<App />`을 `StrictMode`로 렌더링.
- `src/App.tsx` — 최상위 애플리케이션 컴포넌트.
- `src/index.css` — 전역 스타일. `src/App.css` — `App` 컴포넌트 전용 스타일.
- `public/` — 정적 자산(파비콘, 아이콘 스프라이트 등). 빌드 시 그대로 복사됨.
- TypeScript 설정은 `tsconfig.json`(참조용)에서 `tsconfig.app.json`(앱 소스용)과 `tsconfig.node.json`(Vite 설정 등 Node 환경용)으로 분리되어 있습니다.

이 프로젝트는 Vite의 `react-ts` 템플릿으로 스캐폴딩된 초기 상태이며, 아직 라우팅, 상태 관리, API 통신 계층 등은 추가되지 않았습니다.

## 설계 문서

- 이 프로젝트는 PANG(퐁) 게임을 Phase 단위로 나누어 구현합니다. 전체 Phase 계획은 `docs/PLAN.md`를 참고하세요.
- 각 Phase별 상세 구현 설계는 `docs/design/phase{N}.md`에 기록됩니다 (예: `docs/design/phase1.md` — Phase 1: 메인 화면 UI 설계).
- Phase 1 설계에 따르면 화면 단위 컴포넌트는 `src/screens/` 아래에 위치하며(예: `src/screens/MainScreen.tsx`, `src/screens/MainScreen.css`), `App.tsx`는 화면 상태에 따라 해당 화면 컴포넌트를 렌더링하는 역할을 담당하도록 확장될 예정입니다.
- 새로운 Phase를 구현하기 전에는 해당 Phase의 `docs/design/phase{N}.md` 설계 문서를 먼저 확인하고, 설계와 다르게 구현할 경우 문서도 함께 갱신하세요.

## 커밋 컨벤션

- 커밋 메시지 제목은 **한글**로 작성하며, 무엇을 했는지 한 줄로 요약합니다 (예: `Phase 1: 메인 화면 UI 구현 (MainScreen 컴포넌트)`).
- Phase 구현/설계 관련 커밋은 제목을 `Phase {N}: <내용>` 형식으로 시작합니다 (예: `Phase 2: 메인 → 게임 화면 전환 구현`).
- 문서(`docs/`, `CLAUDE.md`, `AGENTS.md` 등)만 변경하는 커밋은 어떤 문서를 왜 바꿨는지 제목에 드러나도록 작성합니다 (예: `PLAN.md의 Phase를 더 세분화하여 12단계로 재구성`).
- 제목만으로 배경 설명이 부족할 때만 본문을 작성하고, 본문에는 "무엇을/왜"를 중심으로 간결하게 적습니다.
- 하나의 커밋에는 하나의 논리적 변경만 담습니다 (예: Phase 구현과 무관한 리팩터링을 함께 커밋하지 않음).
- 커밋 메시지 마지막 줄에 `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`를 포함합니다.
