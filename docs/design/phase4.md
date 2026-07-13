# DESIGN — Phase 4: 작살 발사 동작

`docs/PLAN.md`의 Phase 4(작살 발사 동작) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "발사 키를 눌렀을 때 작살이 똑바로 위로 나가는지"와 "연속으로 눌렀을 때 반응이 끊기거나 밀리지 않는지"만 검증 가능한 최소 발사 기능을 만드는 것이며, 풍선이나 충돌 판정은 포함하지 않는다 (맞출 대상이 아직 없음).

관련 규칙: `docs/FEATURES/game_rule.md` 1장(조작) — "작살은 발사 즉시 화면 위쪽 끝(또는 장애물/천장)까지 수직으로 이동하며 경로상의 모든 풍선과 충돌 판정을 갖는다", "동시에 발사 가능한 작살 개수는 기본 1개이며, 파워업(Double Wire) 획득 시 2개로 증가한다."

## 1. 범위

**포함**
- 지정 발사 키(Space) 입력 시, 캐릭터의 현재 위치를 기준으로 작살이 위로 발사됨.
- 작살은 매 프레임 위로 이동하다가 화면 상단에 도달하면 사라짐.
- 기본 규칙에 따라 동시에 존재 가능한 작살은 **최대 1개**로 제한 (이미 화면에 작살이 있으면 재발사는 무시).

**제외 (다음 Phase에서 처리)**
- 풍선 등장 및 작살-풍선 충돌/분열 판정 (Phase 5, 6)
- Double Wire 등 동시 2발 발사 파워업 (`docs/FEATURES/game_rule.md` 6장, 향후 확장 범위)

## 2. 현재 상태

- `src/screens/GameScreen.tsx`는 `usePlayerMovement`로 계산한 `x`를 `Player`에 전달해 렌더링 중 (`src/screens/GameScreen.tsx:8`).
- 발사(작살) 관련 코드/컴포넌트는 아직 없음.

## 3. 폴더/컴포넌트 구조

Phase 3에서 잡은 `src/game/` 구조를 그대로 확장한다.

```
src/
├─ screens/
│   └─ GameScreen.tsx        (수정 — Wire 상태를 연결하고 Wire 렌더링 추가)
└─ game/
    ├─ Player.tsx / Player.css        (기존, Phase 3)
    ├─ usePlayerMovement.ts           (기존, Phase 3)
    ├─ Wire.tsx           (신규 — 작살 표시 컴포넌트)
    ├─ Wire.css           (신규)
    └─ useWireLaunch.ts    (신규 — 발사 키 입력 처리 + 작살 이동/소멸 로직 훅)
```

## 4. 좌표계 및 상수 정의

| 항목 | 값(안) | 비고 |
|---|---|---|
| 발사 키 | `Space` | 필요 시 이후 재정의 가능하도록 훅 내부 상수로 관리 |
| 작살 폭 | 4px | 캐릭터(40px) 대비 얇은 세로 막대 |
| 작살 이동 속도 | 초당 약 480px | 캐릭터 이동 속도(240px/s)보다 빠르게 설정해 사격감을 준다 |
| 동시 발사 개수 | 1개 (기본값) | `docs/FEATURES/game_rule.md` 6장 규칙 반영, Double Wire는 범위 밖 |
| 소멸 조건 | 작살의 y좌표가 화면 상단(0 이하)에 도달 | 이번 Phase에서는 천장/장애물 개념이 없으므로 화면 최상단만 기준 |

- 작살의 x좌표는 **발사 시점의 캐릭터 중심 x좌표로 고정**된다 (원작처럼 발사 후에는 캐릭터가 움직여도 이미 발사된 작살은 따라가지 않음).
- 작살의 y좌표(화면 좌표계, 위=0)는 캐릭터의 발사 지점(캐릭터 상단)에서 시작해 매 프레임 감소한다.

## 5. 발사/이동 로직 설계 (`useWireLaunch`)

- 훅은 다음을 인자로 받는다: 현재 플레이어 x좌표(`playerX`), 플레이어 폭(`playerWidth`), 플레이어 발사 지점의 y좌표(`launchY`, 캐릭터 상단 기준 고정값).
- 내부 상태: `wire: { x: number; y: number } | null` — 작살이 없으면 `null`.
- `keydown`으로 발사 키 입력을 감지하되, **이미 `wire`가 존재하면 새 발사를 무시**한다 (동시 1개 제한).
- 발사 시 `wire = { x: playerX + playerWidth / 2, y: launchY }`로 생성.
- `usePlayerMovement`와 마찬가지로 `requestAnimationFrame` 기반 delta-time 루프에서 `wire.y`를 감소시키고, `wire.y <= 0`이 되면 `wire = null`로 전환해 소멸시킨다.
- 컴포넌트 언마운트 시 `requestAnimationFrame`과 키 이벤트 리스너를 정리(cleanup)한다 (`usePlayerMovement`와 동일한 패턴).

```ts
// src/game/useWireLaunch.ts (개념 스케치)
function useWireLaunch(playerX: number, playerWidth: number, launchY: number, speed = 480) {
  const [wire, setWire] = useState<{ x: number; y: number } | null>(null)
  const wireRef = useRef(wire)
  wireRef.current = wire

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (wireRef.current) return // 동시 1개 제한
      setWire({ x: playerX + playerWidth / 2, y: launchY })
    }

    let raf: number
    let lastTime = performance.now()
    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time
      setWire((prev) => {
        if (!prev) return prev
        const nextY = prev.y - speed * dt
        return nextY <= 0 ? null : { ...prev, y: nextY }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [playerX, playerWidth, launchY, speed])

  return wire
}
```

- `playerX`는 발사 "순간"의 값만 사용하면 되지만, 훅 의존성 배열에 포함시켜 매 리렌더마다 최신 클로저를 사용하도록 한다 (발사 이후에는 `wire.x`가 고정되어 재계산되지 않으므로 실제 이동 중인 작살 위치에는 영향 없음).

## 6. `Wire` 컴포넌트 및 `GameScreen` 연동 (안)

```tsx
// src/game/Wire.tsx
type WireProps = { x: number; y: number }

function Wire({ x, y }: WireProps) {
  return <div className="wire" style={{ transform: `translate(${x}px, ${y}px)` }} />
}
```

```tsx
// src/screens/GameScreen.tsx (수정 방향)
function GameScreen() {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)
  const wire = useWireLaunch(x, PLAYER_WIDTH, PLAYER_LAUNCH_Y)

  return (
    <div className="game-screen">
      <Player x={x} />
      {wire && <Wire x={wire.x} y={wire.y} />}
    </div>
  )
}
```

- `PLAYER_LAUNCH_Y`는 캐릭터가 화면 하단(`bottom: 24px`, 높이 60px)에 고정되어 있으므로, 이를 화면 좌표(top 기준)로 환산한 상수로 `GameScreen`에서 계산해 전달한다.

## 7. 스타일링 방향

- `Wire.css`에서 작살을 4px 폭의 얇은 세로 막대(예: 높이 20px 정도의 반투명 흰색/보라색 선)로 표시한다.
- `position: absolute; top: 0; left: 0;` 후 `transform: translate(x, y)`로 위치를 갱신해 `Player`와 동일한 렌더링 방식(리렌더 비용 최소화)을 따른다.
- 원작처럼 캐릭터~작살 끝을 잇는 "선이 늘어나는" 비주얼은 이번 Phase의 범위가 아니며, 필요하면 이후 비주얼 개선 단계에서 검토한다.

## 8. 검증 방법 (Phase 4 완료 기준)

- `npm run dev` 실행 후 Space 키를 눌렀을 때 캐릭터 위치에서 작살이 위로 발사되는지 확인.
- 작살이 화면 상단에 도달하면 자연스럽게 사라지는지 확인.
- 작살이 화면에 남아있는 동안 Space를 다시 눌러도 추가로 발사되지 않는지(동시 1개 제한) 확인.
- 작살이 사라진 뒤 Space를 누르면 다시 정상적으로 발사되는지, 연속으로 여러 번 눌러도 반응이 끊기거나 밀리지 않는지 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 9. Phase 5 이후 연동을 위해 남겨두는 지점

- `wire`의 `{ x, y }` 좌표는 Phase 5~6(풍선 등장, 작살-풍선 충돌)에서 그대로 충돌 판정 입력으로 재사용한다.
- 동시 발사 개수 제한(`wireRef.current` 체크)은 이후 Double Wire 파워업 적용 시 "최대 개수" 값을 상수/상태로 바꾸는 방식으로 확장 가능하도록 로직을 단순하게 유지했다.
