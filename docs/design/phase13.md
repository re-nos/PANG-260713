# DESIGN — Phase 13: 캐릭터 디자인 개선

`docs/PLAN.md`의 Phase 13(캐릭터 디자인 개선) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "캐릭터가 배경과 구분되어 눈에 잘 띄는지"와 "좌우로 이동할 때 방향에 맞게 자연스럽게 보이는지"를 검증하는 것이며, 걷기 애니메이션이나 의상 커스터마이징 같은 추가 기능은 다루지 않는다.

## 1. 범위

**포함**
- 단색 사각형이었던 `Player`를 캐릭터처럼 보이는 비주얼로 교체.
- 이동 방향(좌/우)에 따라 캐릭터가 반전(facing)되도록 처리.

**제외**
- 걷기/정지 등 프레임 애니메이션 (범위 밖 — 정적인 일러스트 수준까지만).
- 이미지 파일(스프라이트 시트, PNG 등) 기반 에셋 도입.
- 캐릭터 충돌 판정 도형 변경 (Phase 8에서 정한 사각형 판정은 그대로 유지, 시각적 표현만 바꾼다).

## 2. 현재 상태

- `Player`는 `40×60px`의 단색(`#c084fc`) 사각형 `div`로, 위치만 `transform: translateX`로 갱신한다 (`src/game/Player.tsx`, `src/game/Player.css`).
- `usePlayerMovement`는 x좌표 하나만 반환하며, 이동 방향(좌/우 중 어디를 보고 있는지) 정보는 계산하지 않는다 (`src/game/usePlayerMovement.ts:50`).

## 3. 구현 방식 결정 — 이미지 에셋 대신 SVG

지금까지 `Player`/`Balloon`/`Wire` 등 모든 게임 비주얼은 이미지 파일 없이 CSS로 그려진 도형이었다. 이번 Phase도 같은 원칙을 유지해 **인라인 SVG**로 캐릭터를 그린다.

- 이유: 이미지 에셋을 쓰려면 `public/` 아래에 실제 그림 파일이 있어야 하는데, 이 프로젝트에는 아직 그런 에셋 파이프라인(디자인 툴 결과물 반입, 최적화 등)이 없다. SVG는 코드로 직접 정의할 수 있어 별도 에셋 없이도 "사각형보다 나은" 캐릭터 형태를 만들 수 있고, 색상 테마를 CSS 변수/`fill` 속성으로 쉽게 조정할 수 있다.
- 이후 실제 일러스트 에셋(이미지/스프라이트)으로 교체하고 싶다면, `Player` 컴포넌트의 내부 구현만 바꾸면 되고 `PlayerProps` 인터페이스는 그대로 유지 가능하다.

## 4. 이동 방향(facing) 추적 설계

`usePlayerMovement`가 x좌표와 함께 "지금 어느 방향을 보고 있는지"도 반환하도록 확장한다.

```ts
type Facing = 'left' | 'right'

function usePlayerMovement(stageWidth: number, playerWidth: number, speed = 240) {
  const [x, setX] = useState(...)
  const [facing, setFacing] = useState<Facing>('right')

  // ...tick 내부에서 dir 계산 직후...
  if (dir !== 0) {
    setFacing(dir > 0 ? 'right' : 'left')
    setX((prev) => clamp(...))
  }

  return { x, facing }
}
```

- **정지 시 마지막 방향 유지**: 이동 키를 떼면 `dir === 0`이 되어 `facing`을 갱신하지 않으므로, 캐릭터는 멈춘 자리에서 마지막으로 이동하던 방향을 계속 바라본다 (일반적인 2D 플랫폼 게임의 관례를 따름).
- **반환 타입 변경에 따른 영향**: `usePlayerMovement`의 반환값이 숫자(`x`)에서 객체(`{ x, facing }`)로 바뀌므로, 호출부인 `GameStage`에서 `const { x, facing } = usePlayerMovement(...)`로 구조 분해하도록 수정한다. `x`를 그대로 사용하던 나머지 로직(작살 발사 위치, 충돌 판정 사각형 등)은 변경 없이 동작한다.

## 5. `Player` 컴포넌트 디자인 (안)

```tsx
// src/game/Player.tsx
type PlayerProps = {
  x: number
  facing: 'left' | 'right'
}

function Player({ x, facing }: PlayerProps) {
  return (
    <div
      className="player"
      style={{
        transform: `translateX(${x}px) scaleX(${facing === 'left' ? -1 : 1})`,
      }}
    >
      <svg viewBox="0 0 40 60" className="player__svg">
        {/* 머리(원) + 몸통(사각형) + 팔/다리(선) 정도의 단순한 실루엣 */}
        <circle cx="20" cy="12" r="10" className="player__head" />
        <rect x="10" y="22" width="20" height="26" rx="4" className="player__body" />
        <line x1="10" y1="30" x2="2" y2="40" className="player__limb" />
        <line x1="30" y1="30" x2="38" y2="40" className="player__limb" />
        <line x1="15" y1="48" x2="12" y2="60" className="player__limb" />
        <line x1="25" y1="48" x2="28" y2="60" className="player__limb" />
      </svg>
    </div>
  )
}
```

- 좌우 반전은 위치 이동(`translateX`)과 같은 `transform` 선언에 `scaleX`를 함께 적용해 처리한다. 순서상 `translateX` 다음에 `scaleX`를 적용해도, 두 변환 모두 캐릭터 박스 자신의 로컬 좌표계 기준으로 동작하므로 반전 시 위치가 틀어지지 않는다.
- 팔/다리는 단순한 직선(`<line>`)만으로 표현해 "정적인 실루엣" 수준을 유지하고, 애니메이션(걷는 동작 등)은 다루지 않는다.

## 6. 파일 변경 계획

| 파일 | 변경 내용 |
|---|---|
| `src/game/usePlayerMovement.ts` | `facing` 상태 추가, 반환값을 `{ x, facing }` 객체로 변경 |
| `src/game/Player.tsx` | 단색 사각형 대신 SVG 실루엣 렌더링, `facing` prop 추가 및 좌우 반전 처리 |
| `src/game/Player.css` | 배경색 사각형 스타일 제거, SVG를 감싸는 컨테이너 크기(`40×60`)와 위치 스타일만 유지, SVG 도형별 색상(`fill`/`stroke`) 스타일 추가 |
| `src/game/GameStage.tsx` | `usePlayerMovement` 호출부를 `const { x, facing } = usePlayerMovement(...)`로 수정, `<Player x={x} facing={facing} />`로 전달 |

## 7. 스타일링 방향

- 기존 캐릭터 색상(`#c084fc`, 보라 계열)을 몸통(`player__body`) 기본색으로 유지해 지금까지의 색감 정체성을 이어간다.
- 머리(`player__head`)는 살짝 더 밝은 색조로 구분하고, 팔/다리(`player__limb`)는 어두운 외곽선 색(`stroke`)만으로 표현해 단순하지만 사람 형태로 인식되도록 한다.
- 그림자나 입체감은 `filter: drop-shadow(...)` 정도로 가볍게만 적용하고, 과도한 디테일은 넣지 않는다 (범위: "placeholder보다 나은 정도").

## 8. 검증 방법 (Phase 13 완료 기준)

- `npm run dev` 실행 후 캐릭터가 사각형이 아닌 사람 형태의 실루엣으로 보이는지 확인.
- 오른쪽으로 이동할 때와 왼쪽으로 이동할 때 캐릭터가 반전되어 보이는지 확인.
- 이동을 멈췄을 때 마지막으로 향했던 방향을 유지하는지 확인.
- 캐릭터의 이동/화면 경계 clamp, 작살 발사 위치, 풍선과의 접촉 판정 등 기존 동작(Phase 3, 4, 8)이 비주얼 변경 이후에도 동일하게 동작하는지 회귀 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 9. Phase 14 이후 연동을 위해 남겨두는 지점

- 이번 Phase에서 채택한 "인라인 SVG로 도형을 직접 그리는" 방식은 Phase 14(풍선 디자인)·Phase 15(작살 디자인)에서도 동일하게 재사용할 수 있는 패턴이다.
- `usePlayerMovement`가 반환하는 `facing` 값은 이후 캐릭터 관련 비주얼(예: 무기 위치가 방향에 따라 달라지는 경우)이 필요해질 때도 그대로 활용할 수 있다.
