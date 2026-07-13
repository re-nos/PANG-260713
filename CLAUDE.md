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

[Udacity Git Style Guide](https://udacity.github.io/git-styleguide/)를 기반으로 하되, 제목/본문 내용은 한글로 작성합니다. 커밋 메시지는 **제목 / 본문(선택) / 꼬리말(선택)** 세 부분을 빈 줄로 구분합니다.

### 제목

- 형식: `<type>: <제목>` (예: `feat: Phase 1 메인 화면 UI 구현`).
- `type`은 다음 중 하나를 사용합니다.

  | type | 용도 |
  |---|---|
  | `feat` | 새로운 기능/화면 추가 (Phase 구현 등) |
  | `fix` | 버그 수정 |
  | `docs` | `docs/`, `CLAUDE.md`, `AGENTS.md` 등 문서 변경 |
  | `style` | 동작에 영향 없는 서식/포맷 변경 |
  | `refactor` | 기능 변화 없는 코드 구조 개선 |
  | `test` | 테스트 코드 추가/수정 |
  | `chore` | 빌드 설정, 패키지 매니저 등 잡무성 변경 |

- 제목은 50자를 넘기지 않도록 간결하게 작성합니다.
- 마침표 등 문장부호로 끝맺지 않습니다.
- "구현했음/구현함"이 아닌 "구현" 처럼 동사 원형·명사형으로, 명령형 어조로 작성합니다 (변경된 상태를 서술하지 않고 무엇을 하는 커밋인지로 작성).
- Phase 구현/설계 관련 커밋은 제목에 `Phase {N}`을 포함합니다 (예: `feat: Phase 2 메인 → 게임 화면 전환 구현`).

### 본문

- 제목만으로 배경 설명이 부족한 경우에만 작성하며, 제목과 본문 사이는 반드시 빈 줄로 구분합니다.
- 한 줄은 72자를 넘기지 않도록 줄바꿈합니다.
- "어떻게(how)"가 아니라 "무엇을/왜(what/why)" 중심으로 작성합니다.
- 필요 시 여러 문단(빈 줄로 구분) 또는 불릿(`-`)을 사용할 수 있습니다.

### 꼬리말

- 관련 이슈/작업이 있다면 `Resolves: #123`, `See also: #456, #789` 형식으로 표기합니다 (이슈 트래커 도입 전에는 생략 가능).
- 마지막 줄에는 항상 `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`를 포함합니다.

### 기타 원칙

- 하나의 커밋에는 하나의 논리적 변경만 담습니다 (예: 기능 구현과 무관한 리팩터링을 함께 커밋하지 않음).
