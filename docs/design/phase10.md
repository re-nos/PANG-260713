# DESIGN — Phase 10: 메인 화면 복귀 흐름

`docs/PLAN.md`의 Phase 10(메인 화면 복귀 흐름) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "게임 오버 후 메인 화면으로 자연스럽게 복귀되는지"와 "복귀 후 다시 시작 버튼을 눌러 재도전이 정상적으로 되는지"를 검증하는 것이며, Phase 2에서 만든 메인→게임 전환 로직의 **역방향**(게임→메인)을 완성한다.

## 1. 범위

**포함**
- Phase 9에서 텍스트 안내로만 남겨두었던 `GameOverOverlay`의 "다음 동작"을 실제 버튼으로 교체.
- 버튼 클릭 시 `App`의 화면 상태를 `'game'` → `'main'`으로 되돌리는 콜백 연결.
- 메인 화면에서 다시 "시작하기"를 눌렀을 때, 생명/스테이지가 완전히 초기 상태로 시작되는지 확인(리렌더 구조상 자동으로 보장됨을 설계로 명시).

**제외**
- 클리어(`ClearOverlay`) 이후의 메인 복귀 처리 — PLAN.md 상 클리어 후 흐름은 Phase 12(전체 플레이 루프 완성)에서 다루며, 이번 Phase는 "게임 오버 → 메인" 경로만 범위로 한다.

## 2. 현재 상태

- `App`은 `screen: 'main' | 'game'` 상태를 보유하고, `MainScreen`의 `onStart`로만 `'game'`으로 전환한다. 반대 방향(게임 → 메인)으로 전환하는 콜백은 아직 없다 (`src/App.tsx`).
- `GameScreen`은 생명이 0이 되면 `GameOverOverlay`를 렌더링하지만, 이 오버레이에는 클릭 가능한 요소가 없고 "새로고침하라"는 안내 문구만 있다 (`src/game/GameOverOverlay.tsx`).

## 3. 콜백 전달 경로

Phase 2에서 `App` → `MainScreen`으로 `onStart`를 내려준 것과 대칭적으로, 이번에는 `App` → `GameScreen` → `GameOverOverlay`로 "메인으로 돌아가기" 콜백을 내려준다.

```
App (screen 상태 보유)
├─ MainScreen(onStart)                              (Phase 2, 변경 없음)
└─ GameScreen(onExitToMain)                          (수정 — prop 추가)
    └─ GameOverOverlay(onConfirm = onExitToMain)      (수정 — prop 추가, 버튼 렌더링)
```

- `GameScreen`은 `onExitToMain`을 받아 그대로 `GameOverOverlay`에 전달하기만 한다 (자체적으로 가공하지 않음). `GameStage`/`LivesDisplay` 등 게임 오버가 아닌 나머지 트리는 이 prop과 무관하다.

## 4. 파일 변경 계획

| 파일 | 변경 내용 |
|---|---|
| `src/App.tsx` | `GameScreen`에 `onExitToMain={() => setScreen('main')}` 전달 |
| `src/screens/GameScreen.tsx` | `GameScreenProps { onExitToMain: () => void }` 추가, `GameOverOverlay`에 그대로 전달 |
| `src/game/GameOverOverlay.tsx` | 안내 문구를 버튼으로 교체, `onConfirm` prop 추가 |
| `src/game/GameOverOverlay.css` | 버튼 스타일 추가 (`MainScreen.css`의 `.main-screen__start-button`과 톤 통일) |

## 5. 구현 방향 (안)

```tsx
// src/App.tsx
function App() {
  const [screen, setScreen] = useState<Screen>('main')

  if (screen === 'game') {
    return <GameScreen onExitToMain={() => setScreen('main')} />
  }

  return <MainScreen onStart={() => setScreen('game')} />
}
```

```tsx
// src/screens/GameScreen.tsx
type GameScreenProps = {
  onExitToMain: () => void
}

function GameScreen({ onExitToMain }: GameScreenProps) {
  // ...lives/stageKey 상태, handlePlayerHit은 기존과 동일...

  if (lives <= 0) {
    return <GameOverOverlay onConfirm={onExitToMain} />
  }

  return <GameStage key={stageKey} lives={lives} onPlayerHit={handlePlayerHit} />
}
```

```tsx
// src/game/GameOverOverlay.tsx
type GameOverOverlayProps = {
  onConfirm: () => void
}

function GameOverOverlay({ onConfirm }: GameOverOverlayProps) {
  return (
    <div className="game-over-overlay">
      <p className="game-over-overlay__title">GAME OVER</p>
      <button className="game-over-overlay__button" onClick={onConfirm}>
        메인 화면으로
      </button>
    </div>
  )
}
```

- Phase 9에서 넣었던 "새로고침(F5) 후 다시 도전해 주세요" 안내 문구는 이번 Phase에서 버튼으로 완전히 대체되므로 제거한다.

## 6. 재도전 시 초기화가 보장되는 이유

- `App`이 `screen`을 `'main'`으로 되돌리면 `GameScreen`(과 그 하위의 `GameStage`, `lives`/`stageKey` state)이 통째로 언마운트된다. 이후 사용자가 `MainScreen`에서 다시 "시작하기"를 누르면 `GameScreen`이 처음부터 새로 마운트되므로, `lives`는 다시 `INITIAL_LIVES`(3)로, `stageKey`는 다시 `0`으로 시작한다.
- 즉, Phase 8에서 스테이지 재시작에 사용했던 "컴포넌트 리마운트로 상태를 초기화"하는 원칙이 `GameScreen` 단위로도 그대로 적용되는 것이며, 이를 위해 별도로 초기화 로직을 작성할 필요가 없다.

## 7. 스타일링 방향

- `GameOverOverlay.css`에 버튼 스타일을 추가하되, `MainScreen.css`의 시작 버튼과 동일한 색상(`#c084fc` 배경, 어두운 텍스트)을 사용해 "버튼"이라는 인터랙션 요소의 톤을 앱 전체에서 일관되게 유지한다.

## 8. 검증 방법 (Phase 10 완료 기준)

- `npm run dev` 실행 후 의도적으로 생명을 모두 소진해 게임 오버 화면까지 도달.
- "메인 화면으로" 버튼 클릭 시 메인 화면(타이틀 + 시작 버튼)으로 끊김 없이 돌아가는지 확인.
- 메인 화면에서 다시 "시작하기"를 눌렀을 때, 생명이 3개로, 풍선/캐릭터 위치가 처음 상태로 정상적으로 시작되는지 확인.
- 이 흐름을 2~3회 반복해도(게임 오버 → 메인 → 재시작 → 게임 오버 → ...) 상태가 꼬이지 않는지 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 9. Phase 11 이후 연동을 위해 남겨두는 지점

- `App` ↔ `GameScreen` 간 콜백 전달 구조(`onExitToMain`)는 Phase 12(전체 플레이 루프 완성)에서 클리어 후 메인 복귀 처리를 추가할 때도 동일한 패턴(`ClearOverlay`에도 동일하게 `onConfirm` prop 추가)으로 확장한다.
- Mission 1 난이도 적용(Phase 11)은 `GameStage`/`useBalloons`의 초기값 조정만 필요하며, 이번 Phase에서 정리한 화면 전환 구조에는 영향을 주지 않는다.
