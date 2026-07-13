# DESIGN — Phase 7: 최소 크기 소멸 & 스테이지 클리어 감지

`docs/PLAN.md`의 Phase 7(최소 크기 소멸 & 스테이지 클리어 감지) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "마지막 풍선까지 다 없앴을 때 클리어 판정이 정확한 타이밍에 뜨는지"와 "풍선을 다 없애지 않았는데 클리어로 오판하는 경우는 없는지"를 검증하는 것이다. PLAN.md에 명시된 대로 이번 단계에서는 별도의 클리어 화면 디자인 없이, "클리어 상태를 감지하고 최소한의 텍스트로 알려주는 수준"까지만 구현한다.

## 1. 범위

**포함**
- 가장 작은 크기(Lv.1) 풍선이 작살에 맞으면 완전히 소멸하는 것을 확인 (로직은 Phase 6에서 이미 구현됨).
- 화면 내 모든 풍선이 사라졌음을 감지하는 로직.
- 감지되면 화면에 최소한의 "클리어" 텍스트를 표시.

**제외 (다음 Phase에서 처리)**
- 클리어 후 메인 화면으로 돌아가는 흐름 (Phase 10)
- 별도의 클리어 화면 디자인/연출, 점수 표시 (향후 확장)
- 클리어 이후 캐릭터/작살 조작을 잠그는 등의 처리 (범위 밖으로 명시, 9번 참고)

## 2. 현재 상태

- Lv.1 풍선 소멸 로직은 이미 Phase 6에서 구현되어 있다: `splitBalloon`이 `balloon.level <= 1`일 때 빈 배열을 반환해 해당 풍선이 배열에서 제거된다 (`src/game/splitBalloon.ts`). 이번 Phase에서는 이 동작을 재확인만 하면 되고 별도 수정이 필요 없다.
- `GameScreen`은 `balloons` 배열이 몇 개인지와 무관하게 항상 같은 화면을 렌더링하며, "모두 사라졌는지"를 감지하는 로직이 없다 (`src/screens/GameScreen.tsx`).

## 3. 폴더/컴포넌트 구조

```
src/
├─ screens/
│   └─ GameScreen.tsx        (수정 — 클리어 감지 및 오버레이 표시 추가)
└─ game/
    └─ ClearOverlay.tsx       (신규 — 클리어 시 보여줄 최소 텍스트 오버레이)
    └─ ClearOverlay.css       (신규)
```

- 클리어 텍스트는 `GameScreen` 안에 인라인으로 두기보다 `ClearOverlay`라는 별도의 작은 컴포넌트로 분리한다. Phase 12(전체 플레이 루프 완성)에서 이 부분이 실제 클리어 화면으로 교체/확장될 가능성이 높으므로, 지금부터 책임을 분리해 두면 이후 교체가 쉬워진다.

## 4. 클리어 감지 로직

- `balloons.length === 0`이 되는 순간을 "클리어"로 정의한다.
- `GameScreen`에서 렌더링 시점마다 이 값을 파생(derive)해서 사용하며, 별도의 state나 effect 없이 다음과 같이 계산한다.

```tsx
const isCleared = balloons.length === 0
```

- **오판 방지**: `useBalloons`의 초기값(`initial`)은 항상 최소 1개 이상의 풍선을 포함하도록 보장되어 있으므로(`INITIAL_BALLOON_LEVEL`로 시작, `src/screens/GameScreen.tsx:26-35`), 컴포넌트가 처음 렌더링되는 시점에 `balloons.length`가 0이 되어 클리어로 잘못 판정되는 경우는 없다.
- **감지 타이밍**: `balloons` 배열은 `useBalloons`의 물리 루프와 `GameScreen`의 충돌 처리 `useEffect`에서만 갱신되므로, 마지막 풍선이 제거되는 렌더링에서 곧바로 `isCleared`가 `true`가 된다. 별도의 rAF 루프나 effect를 추가로 만들 필요가 없다 (Phase 6에서 채택한 "상태 변경 시 파생 계산" 원칙을 그대로 따름).

## 5. `ClearOverlay` 컴포넌트 및 `GameScreen` 연동 (안)

```tsx
// src/game/ClearOverlay.tsx
function ClearOverlay() {
  return (
    <div className="clear-overlay">
      <p className="clear-overlay__text">CLEAR!</p>
    </div>
  )
}

export default ClearOverlay
```

```tsx
// src/screens/GameScreen.tsx (수정 방향)
function GameScreen() {
  // ...기존 훅 호출...
  const isCleared = balloons.length === 0

  return (
    <div className="game-screen">
      <Player x={x} />
      {wire && <Wire x={wire.x} y={wire.y} />}
      {balloons.map((balloon) => (
        <Balloon key={balloon.id} /* ... */ />
      ))}
      {isCleared && <ClearOverlay />}
    </div>
  )
}
```

## 6. 스타일링 방향

- `ClearOverlay.css`는 화면 전체를 덮는 반투명 어두운 배경(`position: absolute; inset: 0;`) 위에 큰 글씨로 "CLEAR!" 텍스트만 중앙에 표시한다.
- 별도 애니메이션/사운드는 이번 Phase 범위 밖이며, 필요 시 이후 비주얼 개선 단계에서 추가한다.

## 7. 검증 방법 (Phase 7 완료 기준)

- `npm run dev` 실행 후 작살로 풍선을 반복해서 맞춰 Lv.1까지 분열시킨 뒤, Lv.1 풍선을 맞히면 완전히 사라지는지 확인.
- 화면에 남아있는 마지막 풍선(들)까지 모두 제거한 순간, 곧바로 "CLEAR!" 텍스트가 나타나는지 확인.
- 아직 풍선이 화면에 남아있는 상태에서는 클리어 문구가 뜨지 않는지 확인 (오판 여부).
- `npm run build`, `npm run lint` 통과 확인.

## 8. Phase 8 이후 연동을 위해 남겨두는 지점

- `isCleared` 값은 이후 Phase 10(메인 복귀 흐름)·Phase 12(전체 플레이 루프 완성)에서 `App`으로 끌어올려 화면 전환(예: `screen: 'main' | 'game' | 'clear'`)에 사용할 수 있도록, 현재는 `GameScreen` 내부 파생 값으로만 두고 상위로 끌어올리지 않는다.
- `ClearOverlay`는 이후 점수 표시 등이 추가될 자리로, 지금은 텍스트 하나만 렌더링하지만 컴포넌트 경계는 그대로 유지한다.

## 9. 범위 밖 사항에 대한 참고

- 클리어된 이후에도 캐릭터 이동(`usePlayerMovement`)과 작살 발사(`useWireLaunch`)는 계속 동작한다. 조작을 잠그는 처리는 이번 Phase의 검증 기준("클리어 감지가 정확한지")과 무관하므로 범위에 포함하지 않으며, Phase 8(접촉 판정) 이후 게임 상태 전환을 다룰 때 함께 정리한다.
