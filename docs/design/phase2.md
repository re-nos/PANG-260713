# DESIGN — Phase 2: 메인 → 게임 화면 전환

`docs/PLAN.md`의 Phase 2(메인 → 게임 화면 전환) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "시작 버튼을 눌렀을 때 화면이 끊김 없이 전환되는지"만 검증 가능한 최소 전환 로직을 만드는 것이며, 게임 화면 내부의 실제 플레이 요소(캐릭터, 풍선 등)는 포함하지 않습니다.

## 1. 범위

**포함**
- `App` 내부에 "현재 화면이 무엇인지" 상태를 두고, 시작 버튼 클릭 시 메인 화면 → 게임 화면으로 전환.
- 게임 화면은 Phase 2에서는 내용이 없는 빈 화면(placeholder)으로만 구현.

**제외 (다음 Phase에서 처리)**
- 게임 화면 내부의 캐릭터/이동/발사 등 실제 플레이 요소 (Phase 3 이후)
- 게임 오버/클리어 후 메인 화면으로 되돌아가는 로직 (Phase 10)

## 2. 현재 상태

- `src/App.tsx`는 Phase 1에서 만든 `MainScreen`만 항상 렌더링하고 있으며, 화면 전환 개념이 없음.
- `MainScreen`은 `onStart` prop을 받아 호출하지만, 현재는 `console.log('start clicked')` placeholder로만 연결되어 있음 (`src/App.tsx:5`).

## 3. 컴포넌트 구조

```
App                       (화면 상태 보유: 'main' | 'game')
├─ MainScreen              (기존, Phase 1)
└─ GameScreen               (신규, Phase 2 — 빈 화면 placeholder)
```

- 화면 전환의 "무엇을 보여줄지" 판단은 `App`이 전담한다. `MainScreen`/`GameScreen`은 각자 자기 화면만 렌더링하는 순수 표시용 컴포넌트로 유지한다 (Phase 1 설계 원칙과 동일).
- `docs/FEATURES/main.md`에서 정의한 것처럼, 화면 전환은 별도 라우터 라이브러리 없이 컴포넌트 내부 state로 최소 구현한다.

## 4. 파일 변경 계획

| 파일 | 변경 내용 |
|---|---|
| `src/App.tsx` | `useState`로 `screen: 'main' \| 'game'` 상태 추가. `onStart`를 `() => setScreen('game')`로 교체. `screen` 값에 따라 `MainScreen` 또는 `GameScreen` 렌더링 |
| `src/screens/GameScreen.tsx` (신규) | Phase 2에서는 내용 없는 최소 placeholder만 렌더링 (예: 빈 배경 + 임시 안내 텍스트) |
| `src/screens/GameScreen.css` (신규) | `GameScreen` 전용 최소 스타일 (배경색 등, `MainScreen.css`와 톤 맞춤) |

## 5. `App` 구현 방향 (안)

```tsx
import { useState } from 'react'
import './App.css'
import MainScreen from './screens/MainScreen'
import GameScreen from './screens/GameScreen'

type Screen = 'main' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('main')

  if (screen === 'game') {
    return <GameScreen />
  }

  return <MainScreen onStart={() => setScreen('game')} />
}

export default App
```

- `MainScreen`의 `onStart` prop 시그니처(`() => void`)는 Phase 1에서 이미 확정해 둔 것을 그대로 재사용하므로 `MainScreen.tsx` 자체는 수정하지 않는다.
- `screen` 상태는 `App` 밖으로 끌어올리지 않는다 (전역 상태 관리 도구 도입은 범위 밖).

## 6. `GameScreen` 인터페이스 (안)

```tsx
function GameScreen() {
  return (
    <div className="game-screen">
      <p className="game-screen__placeholder">Game Screen (Phase 3에서 채워질 예정)</p>
    </div>
  )
}

export default GameScreen
```

- Phase 2에서는 props 없이 고정 placeholder만 렌더링한다.
- Phase 3부터 캐릭터/풍선 등 실제 플레이 요소가 이 컴포넌트 내부에 추가될 예정이므로, 이번 Phase에서는 내부 마크업을 최소화하고 구조만 잡아둔다.

## 7. 스타일링 방향

- `GameScreen.css`는 `MainScreen.css`와 동일하게 화면 전체를 채우는 어두운 배경(`#16171d`)을 기본으로 하여, 전환 시 배경색이 급격히 바뀌는 위화감을 줄인다.
- placeholder 텍스트는 흐린 색(예: 회색 계열)으로 표시해 "아직 미구현 상태"임을 시각적으로 구분한다.

## 8. 검증 방법 (Phase 2 완료 기준)

- `npm run dev` 실행 후 메인 화면에서 시작 버튼 클릭 시 게임 화면(placeholder)으로 전환되는지 확인.
- 시작 버튼을 빠르게 여러 번 클릭(연타)해도 에러 없이 정상적으로 게임 화면에 머무는지 확인 (한 번 전환된 이후에는 추가 클릭이 불가능한 상태이므로 자연스럽게 안전함).
- `npm run build`, `npm run lint` 통과 확인.

## 9. Phase 3 연동을 위해 남겨두는 지점

- `GameScreen`은 현재 props가 없으므로, Phase 3 이후 캐릭터/풍선 등 게임 상태를 다루기 시작할 때 필요한 props나 내부 state를 자유롭게 추가할 수 있다.
- `App`의 화면 전환 상태(`screen`)는 Phase 10(메인 복귀)에서 `GameScreen` → `MainScreen` 방향 전환에 그대로 재사용된다.
