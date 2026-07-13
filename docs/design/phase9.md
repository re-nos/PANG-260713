# DESIGN — Phase 9: 생명(라이프) 시스템 & 게임 오버

`docs/PLAN.md`의 Phase 9(생명 시스템 & 게임 오버) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "생명이 줄어드는 게 화면에 명확히 보이는지"와 "생명이 0이 되었을 때 게임이 멈추고 게임 오버 처리가 되는지(다음 동작 안내 포함)"를 검증하는 것이며, 게임 오버 후 실제로 메인 화면으로 돌아가는 버튼/전환은 Phase 10에서 다룬다.

관련 규칙: `docs/FEATURES/game_rule.md` 4장 — "기본 생명 개수: 3개", "캐릭터가 풍선에 접촉하면 생명 1개를 소모하고 스테이지를 재시작한다", "생명이 모두 소진된 상태에서 접촉하면 게임 오버로 처리한다."

## 1. 범위

**포함**
- 남은 생명 개수를 화면에 표시.
- 캐릭터가 풍선에 접촉할 때마다 생명을 1개씩 차감.
- 생명이 0이 되면 스테이지를 멈추고(재시작하지 않고) 게임 오버 상태로 전환, 최소한의 안내 문구 표시.

**제외 (다음 Phase에서 처리)**
- 게임 오버 화면에서 실제로 메인 화면으로 돌아가는 버튼/전환 로직 (Phase 10) — 이번 Phase에서는 "다음에 무엇을 해야 하는지"를 텍스트로만 안내한다.
- 점수 기반 생명 추가(엑스트라 라이프) — `docs/FEATURES/game_rule.md` 4장에 언급되어 있으나 향후 확장 범위.

## 2. 현재 상태

- `GameScreen`은 `stageKey`만 상태로 들고 있으며, 캐릭터가 풍선에 닿으면(`onPlayerHit`) 조건 없이 곧바로 `stageKey`를 올려 `GameStage`를 재시작한다 (`src/screens/GameScreen.tsx:4-8`).
- 생명 개념이 아직 없어서, 몇 번을 죽든 항상 재시작만 반복된다.

## 3. 폴더/컴포넌트 구조

```
src/
├─ screens/
│   └─ GameScreen.tsx      (수정 — lives 상태 보유, 게임 오버 분기 추가)
└─ game/
    ├─ GameStage.tsx         (수정 — lives를 prop으로 받아 표시만 담당, 판정/차감 로직은 그대로 onPlayerHit 호출)
    ├─ LivesDisplay.tsx      (신규 — 남은 생명 표시)
    ├─ LivesDisplay.css      (신규)
    ├─ GameOverOverlay.tsx    (신규 — 게임 오버 안내 화면)
    └─ GameOverOverlay.css    (신규)
```

- 생명 차감/게임 오버 판단 같은 "정책" 로직은 `GameScreen`(오케스트레이션 레이어)에 두고, `GameStage`는 여전히 "접촉이 발생했다"는 사실만 `onPlayerHit()`으로 알리는 역할을 그대로 유지한다 (Phase 8에서 잡은 책임 분리를 그대로 따름). `GameStage`는 표시를 위해 `lives` 값만 prop으로 추가로 받는다.

## 4. `GameScreen` 상태 및 분기 설계

```tsx
const INITIAL_LIVES = 3

function GameScreen() {
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [stageKey, setStageKey] = useState(0)

  const handlePlayerHit = () => {
    setLives((prev) => {
      const next = prev - 1
      if (next > 0) setStageKey((k) => k + 1)
      return next
    })
  }

  if (lives <= 0) {
    return <GameOverOverlay />
  }

  return <GameStage key={stageKey} lives={lives} onPlayerHit={handlePlayerHit} />
}
```

- **게임이 "멈추는" 방식**: 생명이 0이 되면 `GameStage`를 아예 렌더링하지 않고 `GameOverOverlay`로 완전히 교체한다. `GameStage`가 언마운트되면 그 안의 `usePlayerMovement`/`useWireLaunch`/`useBalloons`가 모두 정리(cleanup)되어 `requestAnimationFrame` 루프가 멈추므로, "화면이 멈춘다"는 요구사항을 별도의 일시정지 플래그 없이 자연스럽게 만족한다.
- **한 번의 접촉 = 한 번의 차감**: `handlePlayerHit`이 `setLives`와 `setStageKey`를 같은 함수 호출 안에서 함께 처리하므로, React가 이를 한 번의 렌더링으로 배치(batch) 처리해 `stageKey`가 바뀌는 즉시 이전 `GameStage` 인스턴스가 언마운트된다. 따라서 같은 충돌 이벤트로 생명이 두 번 이상 깎이는 경우는 발생하지 않는다.

## 5. `LivesDisplay` 컴포넌트 (안)

```tsx
// src/game/LivesDisplay.tsx
type LivesDisplayProps = { lives: number }

function LivesDisplay({ lives }: LivesDisplayProps) {
  return (
    <div className="lives-display">
      {Array.from({ length: lives }, (_, i) => (
        <span key={i} className="lives-display__icon">♥</span>
      ))}
    </div>
  )
}
```

- `GameStage`가 받은 `lives` prop을 그대로 `LivesDisplay`에 전달해, 기존 `game-screen` 컨테이너(`position: relative`) 안에서 좌측 상단에 절대 위치로 표시한다.
- 하트 개수로 표시하는 이유: `docs/FEATURES/game_rule.md`의 기본 생명 3개 수준에서는 숫자보다 아이콘 나열이 한눈에 파악하기 쉽다. 생명 수가 커지는 경우(엑스트라 라이프 확장 등)는 범위 밖이므로 지금은 단순 나열로 충분하다.

## 6. `GameOverOverlay` 컴포넌트 (안)

```tsx
// src/game/GameOverOverlay.tsx
function GameOverOverlay() {
  return (
    <div className="game-over-overlay">
      <p className="game-over-overlay__title">GAME OVER</p>
      <p className="game-over-overlay__hint">새로고침(F5) 후 다시 도전해 주세요.</p>
    </div>
  )
}
```

- "다음 동작 안내"는 이번 Phase에서는 실제 버튼이 아니라 안내 문구(새로고침 안내)로 대체한다. Phase 10에서 이 문구를 "메인 화면으로" 버튼으로 교체할 예정임을 8절에 명시한다.
- `ClearOverlay`와 달리 `GameStage`가 언마운트된 상태에서 독립적으로 렌더링되므로, `position: fixed; inset: 0;`으로 화면 전체를 스스로 채우도록 스타일링한다 (부모 `.game-screen` 컨테이너에 얹혀지는 방식이 아님).

## 7. `GameStage` 변경 사항

- `GameStageProps`에 `lives: number`를 추가.
- 기존 캐릭터-풍선 충돌 `useEffect`(`src/game/GameStage.tsx:51-65`)는 변경 없이 `onPlayerHit()`만 호출한다 (생명 차감/게임 오버 판단은 상위 책임).
- 렌더링 트리 최상단에 `<LivesDisplay lives={lives} />`를 추가한다.

## 8. 스타일링 방향

- `LivesDisplay.css`: `position: absolute; top: 16px; left: 16px;` + 하트 아이콘 간 여백, 붉은색(`#ff6b6b`, `Balloon`과 동일 계열) 텍스트.
- `GameOverOverlay.css`: `ClearOverlay.css`와 톤(어두운 반투명 배경 + 중앙 정렬 큰 텍스트)을 맞추되, 힌트 문구는 좀 더 작은 글씨로 아래에 배치.

## 9. 검증 방법 (Phase 9 완료 기준)

- `npm run dev` 실행 후 화면 좌측 상단에 생명(하트 3개)이 표시되는지 확인.
- 캐릭터가 풍선에 닿을 때마다 하트가 1개씩 정확히 줄어드는지 확인 (한 번 닿았는데 2개 이상 줄어들지 않는지).
- 하트가 1개 남은 상태에서 한 번 더 닿으면 스테이지가 멈추고 "GAME OVER" 화면으로 전환되는지 확인.
- 게임 오버 화면에서 캐릭터/작살/풍선이 더 이상 움직이지 않는지(화면이 실제로 멈췄는지) 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 10. Phase 10 연동을 위해 남겨두는 지점

- `GameOverOverlay`의 안내 문구("새로고침 후 다시 도전")는 Phase 10에서 "메인 화면으로" 버튼으로 교체되며, 클릭 시 `App`의 화면 상태(`screen: 'main' | 'game'`)를 `'main'`으로 되돌리는 콜백을 `GameOverOverlay`에 prop으로 전달하는 방식으로 확장한다.
- `lives`/`stageKey` 상태를 보유한 `GameScreen`이 이후 Phase 10에서 `App`으로부터 "메인으로 돌아가기" 콜백을 받는 지점이 되므로, 지금 잡아둔 `GameScreen`의 오케스트레이션 책임 구조를 그대로 확장하면 된다.
