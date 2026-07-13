# DESIGN — Phase 5: 풍선 등장 & 바운스 물리

`docs/PLAN.md`의 Phase 5(풍선 등장 & 바운스 물리) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "풍선이 벽/바닥/천장에서 자연스럽게 튕기는지"와 "움직임 속도와 궤적이 어색하지 않은지"만 시각적으로 검증하는 것이며, 작살과의 충돌/분열 판정이나 캐릭터와의 접촉 판정은 포함하지 않는다.

관련 규칙: `docs/FEATURES/game_rule.md` 2장(풍선 규칙) — "풍선은 중력의 영향을 받아 포물선(바운스) 운동을 하며, 바닥/벽/천장에 부딪히면 반사된다", "풍선의 크기가 클수록 바운스 높이가 높고 낙하 속도가 느리며, 작을수록 바운스 주기가 짧고 빠르게 움직인다."

## 1. 범위

**포함**
- 화면에 풍선 1개가 등장해 중력 가속도의 영향을 받아 포물선 운동을 함.
- 바닥/좌우 벽/천장에 부딪히면 반사(반대 방향으로 튕김)되어 화면 밖으로 나가지 않음.

**제외 (다음 Phase에서 처리)**
- 작살-풍선 충돌 및 분열 로직 (Phase 6)
- 캐릭터-풍선 접촉 판정 (Phase 8)
- 풍선 크기별 분열 단계(Lv.1~4) 전체 운용 — 이번 Phase에서는 크기별 속도/바운스 차이를 보여주기 위한 상수만 정의하고, 분열 시 크기 전환 로직 자체는 Phase 6에서 구현

## 2. 현재 상태

- `src/screens/GameScreen.tsx`는 `Player`와 `Wire`만 렌더링 중이며 (`src/screens/GameScreen.tsx`), 풍선(적) 관련 코드/컴포넌트는 아직 없음.

## 3. 폴더/컴포넌트 구조

`src/game/` 구조를 그대로 확장한다.

```
src/
├─ screens/
│   └─ GameScreen.tsx        (수정 — Balloon 렌더링 추가)
└─ game/
    ├─ Player.tsx / Player.css / usePlayerMovement.ts   (기존)
    ├─ Wire.tsx / Wire.css / useWireLaunch.ts             (기존)
    ├─ Balloon.tsx           (신규 — 풍선 표시 컴포넌트)
    ├─ Balloon.css           (신규)
    └─ useBalloonPhysics.ts   (신규 — 중력/반사 물리 계산 훅)
```

## 4. 풍선 크기 및 물리 상수 정의

`docs/FEATURES/game_rule.md`의 "크기가 클수록 높고 느리게, 작을수록 낮고 빠르게" 규칙을 반영해, 크기 레벨별 반지름과 초기 속도를 상수 테이블로 정의한다. 분열 로직(Phase 6) 이전이므로 이번 Phase에서는 이 테이블 중 **하나의 레벨**만 사용해 풍선 1개를 등장시킨다.

| 레벨 | 반지름(px) | 초기 상승 속도(px/s) | 비고 |
|---|---|---|---|
| Lv.4 (최대) | 48 | 520 | Phase 5 시연에는 이 레벨 사용 |
| Lv.3 | 36 | 440 | Phase 6 이후 분열 시 사용 |
| Lv.2 | 24 | 360 | 〃 |
| Lv.1 (최소) | 12 | 280 | 〃 — 맞으면 소멸 |

- 중력 가속도(`GRAVITY`)는 모든 레벨 공통으로 약 900px/s²로 설정한다. 레벨별로 반지름/초기 속도만 다르게 하면 자연스럽게 "큰 풍선은 느리고 높게, 작은 풍선은 빠르고 낮게" 바운스하는 효과가 나온다.
- 반사 시 속도 크기는 그대로 유지(완전 탄성 충돌)한다. 에너지 손실을 주지 않아야 바운스 높이가 시간이 지나도 줄어들지 않고 일정하게 유지되어, 원작과 동일하게 "꺼지지 않는" 움직임을 보여줄 수 있다.

## 5. 물리 로직 설계 (`useBalloonPhysics`)

- 입력: 무대 크기(`stageWidth`, `stageHeight`), 풍선 반지름(`radius`), 초기 위치/속도.
- 내부 상태: `{ x, y, vx, vy }` (좌표는 원의 중심 기준).
- `usePlayerMovement`/`useWireLaunch`와 동일하게 `requestAnimationFrame` 기반 delta-time 루프를 사용한다.
- 매 프레임 계산:
  1. `vy += GRAVITY * dt` (중력 적용)
  2. `x += vx * dt`, `y += vy * dt`
  3. 바닥 반사: `y + radius >= stageHeight` → `y = stageHeight - radius`, `vy = -vy`
  4. 천장 반사: `y - radius <= 0` → `y = radius`, `vy = -vy`
  5. 좌/우 벽 반사: `x - radius <= 0` → `x = radius`, `vx = -vx` / `x + radius >= stageWidth` → `x = stageWidth - radius`, `vx = -vx`
- 초기 값은 등장 시 화면 상단 근처에 배치하고, `vx`는 좌우 중 한 방향으로 고정 속도(예: ±160px/s)를 부여해 바운스하며 좌우로도 이동하는 모습을 보여준다.

```ts
// src/game/useBalloonPhysics.ts (개념 스케치)
const GRAVITY = 900

function useBalloonPhysics(stageWidth: number, stageHeight: number, radius: number, initial: BalloonState) {
  const [balloon, setBalloon] = useState(initial)

  useEffect(() => {
    let raf: number
    let lastTime = performance.now()
    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time
      setBalloon((prev) => {
        let { x, y, vx, vy } = prev
        vy += GRAVITY * dt
        x += vx * dt
        y += vy * dt

        if (y + radius >= stageHeight) { y = stageHeight - radius; vy = -vy }
        if (y - radius <= 0) { y = radius; vy = -vy }
        if (x - radius <= 0) { x = radius; vx = -vx }
        if (x + radius >= stageWidth) { x = stageWidth - radius; vx = -vx }

        return { x, y, vx, vy }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stageWidth, stageHeight, radius])

  return balloon
}
```

## 6. `Balloon` 컴포넌트 및 `GameScreen` 연동 (안)

```tsx
// src/game/Balloon.tsx
type BalloonProps = { x: number; y: number; radius: number }

function Balloon({ x, y, radius }: BalloonProps) {
  const size = radius * 2
  return (
    <div
      className="balloon"
      style={{
        width: size,
        height: size,
        transform: `translate(${x - radius}px, ${y - radius}px)`,
      }}
    />
  )
}
```

```tsx
// src/screens/GameScreen.tsx (수정 방향)
const BALLOON_RADIUS = 48 // Lv.4

function GameScreen() {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)
  const wire = useWireLaunch(x, PLAYER_WIDTH, PLAYER_LAUNCH_Y)
  const balloon = useBalloonPhysics(window.innerWidth, window.innerHeight, BALLOON_RADIUS, {
    x: window.innerWidth / 2,
    y: BALLOON_RADIUS * 2,
    vx: 160,
    vy: 0,
  })

  return (
    <div className="game-screen">
      <Player x={x} />
      {wire && <Wire x={wire.x} y={wire.y} />}
      <Balloon x={balloon.x} y={balloon.y} radius={BALLOON_RADIUS} />
    </div>
  )
}
```

## 7. 스타일링 방향

- `Balloon.css`에서 원형(`border-radius: 50%`)의 단색(또는 그라디언트) 도형으로 표시해 "풍선"임을 직관적으로 알아볼 수 있게 한다.
- `Player`/`Wire`와 동일하게 `position: absolute` + `transform: translate`로 배치해 리렌더 비용을 최소화한다.

## 8. 검증 방법 (Phase 5 완료 기준)

- `npm run dev` 실행 후 풍선이 화면에 등장해 위아래로 튕기며 좌우로도 이동하는지 확인.
- 바닥/천장/좌우 벽에 닿았을 때 반사되어 화면 밖으로 새거나 멈추지 않고 계속 움직이는지 확인.
- 일정 시간(예: 1분 이상) 방치했을 때도 바운스 높이가 비정상적으로 커지거나(발산) 0에 수렴해 멈추지(감쇠) 않는지 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 9. Phase 6 연동을 위해 남겨두는 지점

- Phase 6(작살-풍선 충돌 & 분열)에서는 `Wire`의 `{x, y}`와 `Balloon`의 `{x, y, radius}`를 비교하는 충돌 판정 로직이 추가되며, 충돌 시 현재 레벨(위 상수 테이블)보다 한 단계 작은 레벨 2개로 분열시키는 로직이 `useBalloonPhysics`를 확장하거나 이를 감싸는 상위 훅(예: `useBalloons`, 복수 풍선 배열 관리)으로 이어진다.
- 레벨별 상수 테이블(4단계)은 이번 Phase에서 미리 정의해 두었으므로, Phase 6에서는 분열 시 레벨 인덱스만 낮춰 재사용하면 된다.
