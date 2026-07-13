# DESIGN — Phase 8: 캐릭터-풍선 접촉 판정 & 스테이지 재시작

`docs/PLAN.md`의 Phase 8(캐릭터-풍선 접촉 판정 & 스테이지 재시작) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "접촉 판정이 실제 부딪힌 느낌과 맞는지"와 "재시작 시 캐릭터/풍선 위치가 처음 상태로 잘 초기화되는지"를 검증하는 것이며, 생명(라이프) 차감이나 게임 오버 처리는 Phase 9에서 다룬다.

관련 규칙: `docs/FEATURES/game_rule.md` 3장 — "캐릭터가 풍선(모든 크기)에 접촉하면 생명 1개를 소모하고 스테이지를 재시작한다." 이번 Phase에서는 생명 차감 없이 **접촉 시 즉시 스테이지가 초기 상태로 재시작**되는 것까지만 구현한다.

## 1. 범위

**포함**
- 캐릭터(사각형)와 풍선(원, 크기 무관) 사이의 접촉 판정.
- 접촉 시 캐릭터 위치, 작살, 풍선 배열을 모두 스테이지 시작 시점의 초기 상태로 되돌리는 재시작 로직.

**제외 (다음 Phase에서 처리)**
- 생명(라이프) 차감 및 게임 오버 처리 (Phase 9)
- 게임 오버 후 메인 화면 복귀 (Phase 10)

## 2. 현재 상태

- `GameScreen`은 `usePlayerMovement`, `useWireLaunch`, `useBalloons` 세 훅을 직접 호출하고, 작살-풍선 충돌만 `useEffect`로 처리하고 있다 (`src/screens/GameScreen.tsx:24-48`).
- 캐릭터와 풍선의 접촉을 감지하는 로직이 없고, "스테이지를 초기 상태로 되돌리는" 방법도 아직 없다 (각 훅이 자신의 초기값을 `useState`로 한 번만 계산하기 때문에, 외부에서 세 훅을 동시에 초기 상태로 되돌릴 방법이 없음).

## 3. 재시작 전략 — 컴포넌트 리마운트(key 교체) 방식

캐릭터 위치(`usePlayerMovement`), 작살(`useWireLaunch`), 풍선 배열(`useBalloons`)은 각각 독립된 훅의 내부 `useState`로 관리되고 있어, "셋을 동시에 초기 상태로 되돌리기" 위해 각 훅에 별도의 `reset()` 함수를 추가해 수동으로 맞추는 방법도 있지만, 훅이 늘어날수록 재시작 시 빠뜨리는 상태가 생기기 쉽다.

대신 **React의 `key` 교체를 이용한 컴포넌트 리마운트** 방식을 채택한다. 실제 플레이 로직(캐릭터/작살/풍선/충돌 판정)을 담당하는 부분을 `GameStage`라는 하위 컴포넌트로 분리하고, 그 위의 `GameScreen`이 `stageKey`(재시작 횟수)를 상태로 들고 있다가 캐릭터-풍선 접촉이 감지되면 `stageKey`를 증가시켜 `GameStage`를 통째로 다시 마운트한다. React는 `key`가 바뀌면 기존 인스턴스를 버리고 완전히 새로운 인스턴스를 만들기 때문에, `GameStage` 안의 모든 `useState` 초기값이 처음 그대로 다시 계산되어 "빠뜨림 없는 초기화"가 보장된다.

```
GameScreen (stageKey 상태 보유)
└─ GameStage key={stageKey}   (캐릭터/작살/풍선/충돌 판정 — 기존 GameScreen 로직 이동)
    onPlayerHit={() => setStageKey((k) => k + 1)}
```

## 4. 폴더/컴포넌트 구조

```
src/
├─ screens/
│   └─ GameScreen.tsx   (수정 — stageKey만 보유, GameStage를 key와 함께 렌더링)
└─ game/
    ├─ GameStage.tsx     (신규 — 기존 GameScreen의 플레이 로직을 그대로 이동)
    └─ collision.ts       (신규 — 원-원/원-사각형 충돌 판정 유틸을 한 곳에 모음)
```

- 기존 `GameScreen.tsx`에 있던 `distance` 함수와 작살-풍선 충돌 로직(`src/screens/GameScreen.tsx:20-48`)은 `GameStage.tsx`로 이동하며, 캐릭터-풍선 판정에 필요한 원-사각형 충돌 함수와 함께 `collision.ts`로 정리한다.

## 5. 접촉 판정 설계 (`collision.ts`)

- 작살-풍선 판정(원-점, Phase 6)은 그대로 유지한다.
- 캐릭터(사각형)-풍선(원) 판정은 "원과 사각형의 최근접점 거리"로 계산한다.

```ts
// src/game/collision.ts
export function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function circleIntersectsRect(
  circle: { x: number; y: number; radius: number },
  rect: { left: number; top: number; right: number; bottom: number },
) {
  const closestX = Math.max(rect.left, Math.min(circle.x, rect.right))
  const closestY = Math.max(rect.top, Math.min(circle.y, rect.bottom))
  return distance(circle, { x: closestX, y: closestY }) <= circle.radius
}
```

- 캐릭터의 사각형 영역은 `{ left: x, right: x + PLAYER_WIDTH, top: PLAYER_LAUNCH_Y, bottom: PLAYER_LAUNCH_Y + PLAYER_HEIGHT }`로 매 프레임 계산한다 (`x`는 `usePlayerMovement`가 반환하는 현재 위치).
- 판정 단순화에 대한 근거: 캐릭터를 사각형 그대로, 풍선을 원 그대로 사용해 실제 렌더링되는 도형과 판정 도형이 일치하므로, "닿았는데 안 죽는다"거나 "닿지 않았는데 죽는다"는 위화감이 생기지 않는다 (Phase 6에서 작살에 적용했던 "끝점만 보는" 단순화와 달리, 이번에는 판정 정밀도가 체감에 직접적인 영향을 주므로 더 정확한 방식을 사용).

## 6. `GameStage` 구현 방향 (안)

```tsx
// src/game/GameStage.tsx
type GameStageProps = {
  onPlayerHit: () => void
}

function GameStage({ onPlayerHit }: GameStageProps) {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)
  const [wire, dismissWire] = useWireLaunch(x, PLAYER_WIDTH, PLAYER_LAUNCH_Y)
  const [balloons, setBalloons] = useBalloons(/* ...기존과 동일... */)

  // 작살-풍선 충돌 (기존 GameScreen 로직 그대로 이동)
  useEffect(() => { /* ... */ }, [wire, balloons, dismissWire, setBalloons])

  // 캐릭터-풍선 접촉 판정 (신규)
  useEffect(() => {
    const playerRect = {
      left: x,
      right: x + PLAYER_WIDTH,
      top: PLAYER_LAUNCH_Y,
      bottom: PLAYER_LAUNCH_Y + PLAYER_HEIGHT,
    }
    const isHit = balloons.some((b) =>
      circleIntersectsRect({ x: b.x, y: b.y, radius: getBalloonLevelConfig(b.level).radius }, playerRect),
    )
    if (isHit) onPlayerHit()
  }, [x, balloons, onPlayerHit])

  const isCleared = balloons.length === 0

  return (
    <div className="game-screen">
      <Player x={x} />
      {wire && <Wire x={wire.x} y={wire.y} />}
      {balloons.map((balloon) => (/* ...기존과 동일... */))}
      {isCleared && <ClearOverlay />}
    </div>
  )
}
```

```tsx
// src/screens/GameScreen.tsx (수정 방향)
function GameScreen() {
  const [stageKey, setStageKey] = useState(0)
  return <GameStage key={stageKey} onPlayerHit={() => setStageKey((k) => k + 1)} />
}
```

- `onPlayerHit`은 매 리렌더마다 새로 생성되는 인라인 함수이지만, `GameStage`가 리마운트될 때 함께 새로 바인딩되므로 문제되지 않는다 (Phase 6에서 다뤘던 "안정적인 콜백" 이슈와는 성격이 다름 — 여기서는 클릭 시점의 최신 콜백이면 충분).
- `GameScreen`의 `game-screen` 컨테이너 div(`position: relative`)는 `GameStage`로 그대로 옮긴다.

## 7. 재시작 시 검증해야 할 초기화 범위

리마운트 방식이므로 아래 항목이 **자동으로** 초기화됨을 확인하는 것이 검증의 핵심이다.

| 항목 | 초기화 방식 |
|---|---|
| 캐릭터 위치 | `usePlayerMovement`가 다시 호출되며 `(stageWidth - playerWidth) / 2`로 재계산 |
| 작살 | `useWireLaunch`가 다시 호출되며 `wire = null`로 시작 |
| 풍선 배열 | `useBalloons`가 다시 호출되며 `GameStage` 최초 렌더 시 계산되는 초기 배열(Lv.3 풍선 1개, 새 `id`)로 재생성 |

## 8. 스타일링

- 별도 스타일 변경 없음. `game-screen` 클래스는 `GameStage`로 그대로 이동한다.

## 9. 검증 방법 (Phase 8 완료 기준)

- `npm run dev` 실행 후 캐릭터를 풍선 쪽으로 움직여 실제로 겹쳤을 때만 스테이지가 재시작되는지 확인 (스치기 전에 죽거나, 겹쳤는데 안 죽는 경우가 없는지).
- 재시작 후 캐릭터가 항상 화면 중앙(초기 위치)에서 다시 시작하는지 확인.
- 재시작 후 풍선이 처음과 동일한 크기/위치/개수(Lv.3 풍선 1개)로 다시 등장하는지 확인.
- 재시작 직전에 화면에 떠 있던 작살이 재시작 후 남아있지 않은지 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 10. Phase 9 연동을 위해 남겨두는 지점

- `onPlayerHit` 콜백은 Phase 9(생명 시스템)에서 "생명을 1개 차감하고, 남은 생명이 있으면 재시작, 없으면 게임 오버"로 확장될 지점이다. 지금은 `GameScreen`이 곧바로 `stageKey`를 올려 재시작만 하지만, 이후 `GameScreen`에 `lives` 상태를 추가하고 `onPlayerHit`에서 `lives`를 먼저 감소시킨 뒤 0보다 크면 재시작하도록 확장한다.
- `collision.ts`는 이후 Phase(사다리, 파워업 등)에서도 재사용 가능한 공용 유틸 위치로 유지한다.
