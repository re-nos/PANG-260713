# DESIGN — Phase 1: 메인 화면 UI

`docs/PLAN.md`의 Phase 1(메인 화면 UI) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "게임 실행 시 타이틀 화면이 에러 없이 잘 보이는지"만 검증 가능한 최소 UI를 만드는 것이며, 화면 전환/실제 게임 로직은 포함하지 않습니다.

## 1. 범위

**포함**
- 타이틀(게임 제목) 표시
- 시작 버튼 UI 및 클릭 이벤트 훅(연결 지점만 마련)

**제외 (다음 Phase에서 처리)**
- 시작 버튼 클릭 시 실제 화면 전환 로직 (Phase 2)
- 게임 화면/캐릭터/풍선 등 게임 플레이 요소 (Phase 3 이후)

## 2. 현재 상태

- `src/App.tsx`는 현재 `<h1>Hello World</h1>`만 렌더링하는 Vite 템플릿 초기 상태.
- 별도 화면(스크린) 컴포넌트 구조가 없음.

## 3. 컴포넌트 구조

```
App
└─ MainScreen        (신규)
    - 타이틀 영역
    - 시작 버튼
```

- `App.tsx`는 Phase 1에서는 `MainScreen`을 그대로 렌더링하는 역할만 한다 (Phase 2에서 `screen` 상태에 따라 `MainScreen` / `GameScreen`을 분기하도록 확장 예정).
- `MainScreen`은 별도 상태를 갖지 않는 순수 표시용(presentational) 컴포넌트로 만든다.

## 4. 파일 변경 계획

| 파일 | 변경 내용 |
|---|---|
| `src/screens/MainScreen.tsx` (신규) | 타이틀 + 시작 버튼 마크업, `onStart` prop 수신 |
| `src/screens/MainScreen.css` (신규) | `MainScreen` 전용 스타일 |
| `src/App.tsx` | `Hello World` 렌더링 제거, `MainScreen` 렌더링으로 교체 |
| `src/App.css` | Phase 1에서 불필요해진 템플릿 기본 스타일 정리 (필요 시) |

`docs/FEATURES/main.md`의 프로젝트 구조 원칙(화면 전용 스타일 분리)을 따라, 화면 단위 컴포넌트는 `src/screens/` 아래에 모아 이후 `GameScreen` 등과 일관된 위치를 갖도록 한다.

## 5. `MainScreen` 인터페이스 (안)

```tsx
type MainScreenProps = {
  onStart: () => void
}

function MainScreen({ onStart }: MainScreenProps) {
  return (
    <div className="main-screen">
      <h1 className="main-screen__title">PANG</h1>
      <button className="main-screen__start-button" onClick={onStart}>
        시작하기
      </button>
    </div>
  )
}
```

- `onStart`는 Phase 1에서는 `App.tsx`에서 `() => console.log('start clicked')` 같은 placeholder로 전달한다.
- Phase 2에서 `onStart`를 실제 화면 전환 로직(`setScreen('game')`)으로 교체하기만 하면 되도록, prop 시그니처를 미리 확정해 둔다.

## 6. 스타일링 방향

- 별도 디자인 시스템/라이브러리 도입 없이 순수 CSS(`MainScreen.css`)로 구현.
- 레이아웃: 화면 전체를 채우는 flex 컨테이너로 타이틀과 버튼을 세로 중앙 정렬.
- 톤앤매너: 아케이드 게임 느낌을 위한 어두운 배경 + 강조 색상 타이틀 정도로 최소한만 적용하고, 세부 디자인은 이후 다듬는다.
- 반응형: 브라우저 창 크기에 따라 레이아웃이 깨지지 않도록 `vh`/`vw` 또는 flex 기반 중앙 정렬만 우선 적용 (모바일 대응은 범위 외).

## 7. 검증 방법 (Phase 1 완료 기준)

- `npm run dev` 실행 후 브라우저에서 타이틀과 시작 버튼이 에러 없이 렌더링되는지 확인.
- 시작 버튼 클릭 시 콘솔에 placeholder 로그가 출력되는지 확인 (아직 화면 전환은 없음).
- `npm run build` 시 타입 에러 없이 빌드되는지 확인.

## 8. Phase 2 연동을 위해 남겨두는 지점

- `MainScreen`은 `onStart` prop만으로 동작하므로, Phase 2에서 `App.tsx`에 화면 상태(`screen: 'main' | 'game'`)를 추가하고 `onStart`에 실제 전환 함수를 연결하면 `MainScreen` 자체는 수정 없이 재사용 가능하다.
