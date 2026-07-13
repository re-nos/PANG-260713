# DESIGN — Phase 12: Mission 1 전체 플레이 루프 완성

`docs/PLAN.md`의 Phase 12(Mission 1 전체 플레이 루프 완성) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "처음부터 끝까지 한 번의 세션으로 직접 플레이했을 때 전체적으로 게임처럼 느껴지는지"와 "이전 Phase에서 놓친 버그가 없는지"를 종합적으로 점검하는 것이다. Phase 1~11은 각자의 기능을 독립적으로 검증해 왔지만, 그 과정에서 **클리어 이후 흐름이 게임 오버 이후 흐름과 대칭이 맞지 않는 채로 남아있다** — 이번 Phase의 핵심은 이 비대칭을 없애 메인 → 시작 → 플레이 → (클리어 | 게임 오버) → 메인 복귀가 끊김 없이 한 바퀴 돌도록 마무리하는 것이다.

## 1. 범위

**포함**
- `ClearOverlay`에 `GameOverOverlay`(Phase 10)와 동일하게 "메인 화면으로" 버튼을 추가하고 `App`까지 연결.
- 클리어된 순간에도 게임 오버와 마찬가지로 화면(캐릭터/작살/풍선 시뮬레이션)이 완전히 멈추도록 통일.
- `GameScreen`이 "진행 중(playing) / 클리어(cleared) / 게임 오버(gameover)"라는 하나의 상태(phase)로 흐름을 관리하도록 정리.
- Phase 1~11 전체를 잇는 회귀 점검 체크리스트 정의.

**제외**
- Mission 2 진입, 점수/파워업 등 향후 확장 항목 (`docs/PLAN.md` "향후 확장" 절 그대로 유지).

## 2. 현재 상태 — 발견된 비대칭/미완성 지점

| 항목 | 게임 오버 경로 (Phase 9~10에서 완성) | 클리어 경로 (Phase 7에서 미완성 상태로 남음) |
|---|---|---|
| 화면 표시 | `GameOverOverlay` | `ClearOverlay` |
| "메인으로" 버튼 | 있음 (`onConfirm` prop, `src/game/GameOverOverlay.tsx`) | **없음** — 텍스트만 표시 (`src/game/ClearOverlay.tsx`) |
| 화면이 멈추는 방식 | `GameScreen`이 `GameStage`를 아예 언마운트하고 오버레이로 교체 (`src/screens/GameScreen.tsx:23-25`) | `GameStage`가 계속 마운트된 채, 내부에서 `isCleared`일 때 오버레이만 겹쳐 그림 (`src/game/GameStage.tsx:64,79`) → **캐릭터 이동/작살 발사/풍선 물리 루프가 클리어 후에도 계속 동작** |

즉, 지금 상태로 마지막 풍선을 없애면 "CLEAR!" 문구는 뜨지만 캐릭터는 여전히 움직이고 작살도 계속 쏠 수 있어(맞을 대상이 없을 뿐), "게임이 끝났다"는 느낌이 게임 오버 때와 다르게 어색하다. 이번 Phase에서 이 두 경로를 동일한 구조로 통일한다.

## 3. 통합 상태 모델: `GameScreen`이 하나의 `phase`를 보유

`lives`/`stageKey`라는 개별 상태 대신, "이 판이 지금 어떤 국면인지"를 하나의 상태로 표현한다.

```ts
type Phase = 'playing' | 'cleared' | 'gameover'
```

- `GameStage`는 더 이상 스스로 `ClearOverlay`를 렌더링하지 않는다. 대신 클리어를 감지하면 `onCleared()` 콜백으로 **사실만 보고**하고, 실제로 화면을 어떻게 바꿀지는 `GameScreen`이 결정한다 — Phase 8~9에서 `onPlayerHit()`에 대해 이미 적용한 것과 동일한 책임 분리 원칙을 클리어 이벤트에도 그대로 적용하는 것이다.
- `GameScreen`은 `phase`가 `'playing'`이 아니면 `GameStage`를 렌더링하지 않고 해당하는 오버레이로 완전히 교체한다. `GameStage`가 언마운트되면 내부의 모든 `requestAnimationFrame` 루프와 키 이벤트 리스너가 정리되므로, 클리어 시에도 게임 오버와 동일하게 화면이 확실히 멈춘다.

## 4. 파일 변경 계획

| 파일 | 변경 내용 |
|---|---|
| `src/game/ClearOverlay.tsx` | `onConfirm: () => void` prop 추가, "메인 화면으로" 버튼 렌더링 (텍스트만 있던 기존 구조에 버튼 추가) |
| `src/game/ClearOverlay.css` | 버튼 스타일 추가 (`GameOverOverlay.css`의 버튼 스타일과 동일 톤) |
| `src/game/GameStage.tsx` | `isCleared` 계산 후 `ClearOverlay` 렌더링 제거, 대신 `onCleared` prop을 받아 클리어 감지 시 호출하는 `useEffect` 추가 |
| `src/screens/GameScreen.tsx` | `lives`/`stageKey` 상태를 유지하되 `phase` 상태를 추가로 도입, `phase`에 따라 `GameStage` / `ClearOverlay` / `GameOverOverlay`를 분기 렌더링 |

## 5. 구현 방향 (안)

```tsx
// src/game/GameStage.tsx (수정 방향)
type GameStageProps = {
  lives: number
  onPlayerHit: () => void
  onCleared: () => void
}

function GameStage({ lives, onPlayerHit, onCleared }: GameStageProps) {
  // ...기존 훅/충돌 판정은 동일...

  const isCleared = balloons.length === 0

  useEffect(() => {
    if (isCleared) onCleared()
  }, [isCleared, onCleared])

  return (
    <div className="game-screen">
      {/* ...기존과 동일, ClearOverlay 렌더링은 제거... */}
    </div>
  )
}
```

```tsx
// src/screens/GameScreen.tsx (수정 방향)
type Phase = 'playing' | 'cleared' | 'gameover'

function GameScreen({ onExitToMain }: GameScreenProps) {
  const [phase, setPhase] = useState<Phase>('playing')
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [stageKey, setStageKey] = useState(0)

  const handlePlayerHit = () => {
    setLives((prev) => {
      const next = prev - 1
      if (next > 0) setStageKey((k) => k + 1)
      else setPhase('gameover')
      return next
    })
  }

  const handleCleared = () => setPhase('cleared')

  if (phase === 'gameover') return <GameOverOverlay onConfirm={onExitToMain} />
  if (phase === 'cleared') return <ClearOverlay onConfirm={onExitToMain} />

  return (
    <GameStage key={stageKey} lives={lives} onPlayerHit={handlePlayerHit} onCleared={handleCleared} />
  )
}
```

- Phase 9에서 다뤘던 "한 번의 이벤트 = 한 번의 상태 전환" 원칙(같은 함수 안에서 관련 상태를 함께 갱신해 React가 배치 처리하도록 하는 것)을 `handleCleared`에도 동일하게 적용한다.

## 6. `ClearOverlay` 변경 (안)

```tsx
// src/game/ClearOverlay.tsx
type ClearOverlayProps = {
  onConfirm: () => void
}

function ClearOverlay({ onConfirm }: ClearOverlayProps) {
  return (
    <div className="clear-overlay">
      <p className="clear-overlay__text">CLEAR!</p>
      <button className="clear-overlay__button" onClick={onConfirm}>
        메인 화면으로
      </button>
    </div>
  )
}
```

- `GameOverOverlay.css`의 버튼 스타일(`#c084fc` 배경 등)을 `ClearOverlay.css`에도 동일하게 적용해 두 종료 화면의 인터랙션 톤을 통일한다.

## 7. Phase 1~11 회귀 점검 체크리스트

이번 Phase는 새 기능보다 "이미 만든 것들이 하나로 이어졌을 때도 잘 동작하는가"를 보는 것이 핵심이므로, 아래 항목을 순서대로 한 번씩 플레이하며 확인한다.

| # | 확인 항목 | 관련 Phase |
|---|---|---|
| 1 | 메인 화면 진입 → 시작하기 클릭 → 게임 화면 전환 | 1, 2 |
| 2 | ←/→(A/D)로 캐릭터 좌우 이동, 경계에서 멈춤 | 3 |
| 3 | Space로 작살 발사, 동시 1개 제한, 화면 상단에서 소멸 | 4 |
| 4 | 풍선이 자연스럽게 바운스 (Mission 1 속도로 느리게) | 5, 11 |
| 5 | 작살로 풍선을 맞히면 분열, Lv.1은 완전 소멸 | 6 |
| 6 | 마지막 풍선 제거 시 클리어 처리 및 화면 정지, "메인 화면으로" 버튼 동작 | 7, 12 |
| 7 | 캐릭터가 풍선에 닿으면 스테이지 재시작(캐릭터/작살/풍선 초기화) | 8 |
| 8 | 생명이 하트로 표시되고 접촉마다 정확히 1개씩 감소 | 9 |
| 9 | 생명 0에서 게임 오버, 화면 정지, "메인 화면으로" 버튼 동작 | 9, 10 |
| 10 | 메인 복귀 후 재시작 시 생명 3개/풍선 초기 상태로 완전히 새로 시작 | 10 |
| 11 | 클리어 → 메인 복귀 → 재시작 흐름도 위 10번과 동일하게 초기화되는지 | 12 (신규) |

## 8. 스타일링 방향

- `ClearOverlay.css`는 기존 `.clear-overlay`(반투명 배경 + 큰 텍스트) 구조를 유지하고, `GameOverOverlay.css`의 `.game-over-overlay__button` 스타일을 그대로 옮겨와 `.clear-overlay__button`으로 추가한다.

## 9. 검증 방법 (Phase 12 완료 기준)

- 7절의 회귀 체크리스트 11개 항목을 순서대로 한 번의 플레이 세션 안에서 모두 확인.
- 클리어 화면과 게임 오버 화면 모두에서, 오버레이가 뜬 뒤 캐릭터/작살/풍선이 더 이상 움직이지 않는지(진짜로 멈췄는지) 확인.
- 클리어 → 메인 복귀 → 재시작을 2회 이상 반복해도 상태가 꼬이지 않는지 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 10. 향후 확장을 위해 남겨두는 지점

- `Phase` 타입(`'playing' | 'cleared' | 'gameover'`)은 이후 점수 표시, Mission 2 진입 버튼 등을 추가할 때 `'cleared'` 분기 안에서 그대로 확장할 수 있는 지점이다.
- 이번 Phase로 Mission 1의 "만드는 것" 범위(`docs/PLAN.md` Phase 1~12)가 모두 완성되며, 이후 작업은 PLAN.md의 "향후 확장(Phase 12 이후, 범위 외)" 절에 정리된 점수 시스템/파워업/Mission 2로 이어진다.
