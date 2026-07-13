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
