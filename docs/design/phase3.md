# DESIGN — Phase 3: 캐릭터 등장 & 좌우 이동

`docs/PLAN.md`의 Phase 3(캐릭터 등장 & 좌우 이동) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "캐릭터가 자연스러운 속도로 움직이는지"와 "화면 좌우 끝에서 밖으로 나가지 않고 잘 멈추는지"만 검증 가능한 최소 이동 기능을 만드는 것이며, 발사(작살)나 풍선 등 다른 플레이 요소는 포함하지 않습니다.

관련 규칙: `docs/FEATURES/game_rule.md` 1장(조작) — 캐릭터는 좌우 이동과 사다리를 통한 상하 이동만 가능하고 점프는 불가능하다. Phase 3에서는 사다리가 없는 상태이므로 좌우 이동만 구현한다.

## 1. 범위

**포함**
- `GameScreen`에 플레이어 캐릭터(사각형 등 임시 도형)를 렌더링.
- ← / → 방향키(또는 A / D) 입력에 따라 좌우로 이동.
- 화면 좌우 끝에서 캐릭터가 화면 밖으로 나가지 않도록 위치를 제한(clamp).

**제외 (다음 Phase에서 처리)**
- 작살 발사 (Phase 4)
- 풍선 등장/충돌 (Phase 5 이후)
- 사다리를 통한 상하 이동 (Mission 1 범위에서는 지형에 사다리가 없으므로 이후에도 우선순위 낮음)

## 2. 현재 상태

- `src/screens/GameScreen.tsx`는 현재 placeholder 텍스트만 렌더링하고 있음 (`src/screens/GameScreen.tsx:6`).
- 게임 내부 엔티티(캐릭터, 풍선 등)를 다루는 코드/폴더가 아직 없음.

## 3. 폴더/컴포넌트 구조

Phase 3부터는 화면(스크린) 컴포넌트와 게임 내부 엔티티를 분리한다. 이후 Phase(작살, 풍선, 충돌 등)에서도 계속 재사용할 구조이므로 여기서 기준을 잡는다.

```
src/
├─ screens/
│   └─ GameScreen.tsx        (수정 — Player를 렌더링하는 컨테이너 역할)
└─ game/                     (신규 폴더 — 게임 플레이 관련 코드)
    ├─ Player.tsx             (신규 — 캐릭터 표시 컴포넌트)
    ├─ Player.css             (신규)
    └─ usePlayerMovement.ts    (신규 — 키 입력 처리 + 이동 로직 훅)
```

- `GameScreen`은 게임 화면의 "무대(스테이지 영역)" 역할만 하고, 실제 플레이 로직은 `src/game/` 아래 훅/컴포넌트가 담당하도록 책임을 분리한다.
- `usePlayerMovement`는 이후 Phase 4(발사)에서도 "현재 캐릭터 x좌표"를 그대로 참조해야 하므로, 위치 상태를 훅으로 캡슐화해 재사용 가능하게 만든다.

## 4. 좌표계 및 상수 정의

| 항목 | 값(안) | 비고 |
|---|---|---|
| 무대 너비 | `GameScreen` 컨테이너의 실제 픽셀 너비 (`100vw` 기준) | 반응형을 고려해 고정 px 대신 컨테이너 기준 비율/clamp로 계산 |
| 캐릭터 너비 | 40px | 좌우 경계 계산 시 사용 |
| 이동 속도 | 초당 약 240px (프레임당 델타 타임 기반) | 아케이드 원작 대비 과하지 않은 속도로 초기값 설정, 이후 플레이테스트로 조정 |
| 초기 위치 | 화면 가로 중앙 | 스테이지 시작 시 기준 위치 |

- 캐릭터의 세로(y) 위치는 Phase 3에서는 화면 하단 고정값으로 둔다 (사다리/점프가 없으므로 y좌표는 상수).

## 5. 이동 로직 설계 (`usePlayerMovement`)

- 키보드 이벤트(`keydown`/`keyup`)로 좌/우 입력 상태(눌림 여부)만 추적한다. 키 입력마다 위치를 즉시 바꾸는 방식이 아니라, **입력 상태 + 매 프레임 이동량 계산** 방식을 사용해 여러 키를 눌렀을 때도 자연스럽게 동작하도록 한다.
- `requestAnimationFrame` 기반의 게임 루프에서 프레임 간 시간차(delta time)를 계산해 `속도 × delta`만큼 위치를 갱신한다. 이렇게 하면 프레임 레이트가 달라도 이동 속도가 일정하게 유지된다.
- 좌우 이동 후 `Math.max(0, Math.min(위치, 무대너비 - 캐릭터너비))`로 클램프하여 화면 밖으로 나가지 않도록 한다.
- 컴포넌트 언마운트 시 `requestAnimationFrame`과 키 이벤트 리스너를 정리(cleanup)한다.

```ts
// src/game/usePlayerMovement.ts (개념 스케치)
function usePlayerMovement(stageWidth: number, playerWidth: number, speed = 240) {
  const [x, setX] = useState(stageWidth / 2 - playerWidth / 2)

  useEffect(() => {
    const pressed = { left: false, right: false }
    const onKeyDown = (e: KeyboardEvent) => { /* ArrowLeft/A → pressed.left = true 등 */ }
    const onKeyUp = (e: KeyboardEvent) => { /* pressed 해제 */ }

    let raf: number
    let lastTime = performance.now()
    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time
      const dir = (pressed.right ? 1 : 0) - (pressed.left ? 1 : 0)
      if (dir !== 0) {
        setX((prev) => clamp(prev + dir * speed * dt, 0, stageWidth - playerWidth))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [stageWidth, playerWidth, speed])

  return x
}
```

## 6. `Player` / `GameScreen` 컴포넌트 (안)

```tsx
// src/game/Player.tsx
type PlayerProps = { x: number }

function Player({ x }: PlayerProps) {
  return <div className="player" style={{ transform: `translateX(${x}px)` }} />
}
```

```tsx
// src/screens/GameScreen.tsx (수정 방향)
function GameScreen() {
  const stageWidth = /* 컨테이너 ref 기반 측정 또는 window.innerWidth */
  const x = usePlayerMovement(stageWidth, PLAYER_WIDTH)

  return (
    <div className="game-screen">
      <Player x={x} />
    </div>
  )
}
```

- `GameScreen`의 무대 너비 측정은 `useRef` + `ResizeObserver` 또는 초기 버전에서는 `window.innerWidth`로 단순화하고, 이후 Phase에서 필요 시 정교화한다 (창 크기 변경 대응은 Phase 3 검증 범위 밖).

## 7. 스타일링 방향

- `Player.css`에서 캐릭터를 40×60px 정도의 단색 사각형(placeholder)으로 표시하고, `position: absolute` + `transform: translateX`로 좌우 이동을 표현해 리렌더 비용을 줄인다.
- 실제 스프라이트/이미지 에셋은 범위 밖이며, 이후 비주얼 개선 Phase에서 다룬다.

## 8. 검증 방법 (Phase 3 완료 기준)

- `npm run dev` 실행 후 게임 화면에서 캐릭터(사각형)가 보이는지 확인.
- ← / → 키를 눌렀을 때 캐릭터가 해당 방향으로 부드럽게 이동하는지 확인.
- 화면 좌우 끝까지 이동시켰을 때 캐릭터가 화면 밖으로 나가지 않고 경계에서 멈추는지 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 9. Phase 4 연동을 위해 남겨두는 지점

- `usePlayerMovement`가 반환하는 `x` 좌표는 Phase 4(작살 발사)에서 "작살이 어디서 발사되는지" 기준 위치로 그대로 재사용한다.
- `src/game/` 폴더 구조는 이후 `Balloon.tsx`, `Wire.tsx`(작살) 등 게임 엔티티가 늘어날 때도 동일한 방식으로 확장한다.
