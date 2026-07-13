# DESIGN — Phase 6: 작살-풍선 충돌 & 분열 로직

`docs/PLAN.md`의 Phase 6(작살-풍선 충돌 & 분열 로직) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "풍선을 맞췄을 때 정확히 갈라지는지"와 "분열된 풍선들이 자연스럽게 반대 방향으로 튕겨 나가는지"를 검증하는 것이며, 최소 크기(Lv.1) 풍선의 완전 소멸 처리와 스테이지 클리어 감지는 Phase 7에서 다룬다.

관련 규칙: `docs/FEATURES/game_rule.md` 2.1절 — "풍선이 작살에 맞으면 현재 크기가 최소 단계(Lv.1)이면 즉시 소멸하고, 그 외의 경우 한 단계 작은 크기의 풍선 2개로 분열하며 각각 반대 방향으로 튕겨 나간다."

## 1. 범위

**포함**
- 작살(`Wire`)과 풍선(`Balloon`)의 충돌 판정.
- 충돌한 풍선을 규칙에 따라 분열(레벨 -1, 2개) 또는 제거(Lv.1인 경우)하는 로직.
- 화면에 여러 개의 풍선이 동시에 존재하고 각자 독립적으로 물리 시뮬레이션되도록 확장.

**제외 (다음 Phase에서 처리)**
- 모든 풍선이 사라졌을 때 스테이지 클리어를 감지하는 로직 (Phase 7)
- 점수 계산 (향후 확장 범위)
- 캐릭터-풍선 접촉 판정 (Phase 8)

## 2. 현재 상태 — 이번 Phase에서 바뀌는 부분

Phase 5까지는 풍선이 **1개 고정**이었고, 각 훅이 자신의 상태만 관리하며 서로의 상태를 변경할 수 없는 구조였다. Phase 6은 "작살이 풍선을 맞춰서 없애거나 분열시킨다"는, **서로 다른 두 엔티티가 서로에게 영향을 주는 첫 번째 로직**이므로 아래 두 지점을 리팩터링한다.

| 기존 | 변경 |
|---|---|
| `useBalloonPhysics`가 풍선 1개(`{x,y,vx,vy}`)만 관리 (`src/game/useBalloonPhysics.ts`) | `useBalloons`로 이름 변경, 풍선 **배열**을 관리하고 외부에서 배열을 갱신할 수 있도록 `[balloons, setBalloons]` 튜플 반환 |
| `useWireLaunch`가 `wire` 값만 반환 (`src/game/useWireLaunch.ts:42`) | 외부에서 작살을 즉시 소멸시킬 수 있도록 `[wire, dismissWire]` 튜플 반환 |
| `GameScreen`이 각 훅의 결과를 그대로 렌더링만 함 | 충돌 판정 및 분열 처리를 담당하는 `useEffect`를 추가 (5장 참고) |

## 3. 폴더/컴포넌트 구조

```
src/game/
├─ Player.tsx / Player.css / usePlayerMovement.ts   (기존, 변경 없음)
├─ Wire.tsx / Wire.css                                (기존, 변경 없음)
├─ useWireLaunch.ts                                    (수정 — dismissWire 추가)
├─ Balloon.tsx / Balloon.css                           (기존, 변경 없음 — level→radius 변환만 호출부에서 처리)
├─ useBalloonPhysics.ts → useBalloons.ts                (이름 변경 + 배열 관리로 확장)
└─ balloonLevels.ts       (신규 — 레벨별 반지름/속도 상수 테이블, Phase 5 상수를 공용 모듈로 분리)
```

- Phase 5에서 `GameScreen.tsx` 안에 있던 `BALLOON_RADIUS` 단일 상수를, 여러 레벨을 다뤄야 하는 이번 Phase부터는 `balloonLevels.ts`에 테이블로 옮겨 `useBalloons`와 `GameScreen` 양쪽에서 공용으로 참조한다.

```ts
// src/game/balloonLevels.ts
export const BALLOON_LEVELS = [
  { level: 1, radius: 12, riseSpeed: 280 },
  { level: 2, radius: 24, riseSpeed: 360 },
  { level: 3, radius: 36, riseSpeed: 440 },
  { level: 4, radius: 48, riseSpeed: 520 },
] as const

export const MAX_BALLOON_LEVEL = 4
```

## 4. 데이터 모델

```ts
type BalloonState = {
  id: string
  level: 1 | 2 | 3 | 4
  x: number
  y: number
  vx: number
  vy: number
}
```

- `radius`는 상태에 저장하지 않고 `level`로부터 `BALLOON_LEVELS`를 조회해 파생시킨다 (분열 시 값 불일치 방지).
- `id`는 `crypto.randomUUID()`로 생성해 React 리스트 렌더링의 `key`와 충돌 판정 시 "어떤 풍선이 맞았는지" 식별에 사용한다.

## 5. 충돌 판정 설계

- 판정 방식: **원-점 거리 기반 단순화**. 작살의 현재 좌표(`wire.x, wire.y`, 상승 중인 끝점)와 풍선 중심(`balloon.x, balloon.y`) 사이 거리가 `balloon.radius` 이하이면 충돌로 간주한다.
  - 작살을 얇은 막대(선분)로 정확히 처리하지 않고 "끝점 1개"로 단순화하는 이유: 작살 이동 속도(480px/s)와 풍선 반지름(최소 12px)을 고려하면 프레임당 이동 거리가 크지 않아 끝점 판정만으로도 충분히 자연스럽게 맞는 느낌을 준다. 관통(터널링)이 실제로 눈에 띄면 이후 Phase에서 선분-원 판정으로 보강한다.
- 충돌 처리 위치: **별도의 rAF 루프를 새로 만들지 않는다.** `usePlayerMovement`(이동), `useWireLaunch`(작살 이동), `useBalloons`(풍선 물리)가 이미 각자 초당 약 60회 상태를 갱신하며 `GameScreen`을 리렌더시키고 있으므로, `GameScreen`에 `wire`와 `balloons`를 의존성으로 하는 `useEffect`를 두어 "상태가 바뀔 때마다 충돌 여부를 검사"하는 방식으로 구현한다. 이렇게 하면 세 번째 독립 루프를 추가하지 않고도 사실상 매 프레임 검사와 동일한 효과를 얻는다.

```tsx
// src/screens/GameScreen.tsx 내부 (개념 스케치)
useEffect(() => {
  if (!wire) return
  const hitIndex = balloons.findIndex(
    (b) => distance(wire, b) <= BALLOON_LEVELS[b.level - 1].radius,
  )
  if (hitIndex === -1) return

  setBalloons((prev) => prev.flatMap((b, i) => (i === hitIndex ? splitBalloon(b) : [b])))
  dismissWire()
}, [wire, balloons])
```

## 6. 분열 로직 설계 (`splitBalloon`)

```ts
function splitBalloon(balloon: BalloonState): BalloonState[] {
  if (balloon.level <= 1) return [] // Lv.1은 완전 소멸 (Phase 7에서 클리어 감지에 활용)

  const nextLevel = (balloon.level - 1) as BalloonState['level']
  const { riseSpeed } = BALLOON_LEVELS[nextLevel - 1]
  const splitVx = 120 // 좌우로 갈라지는 수평 속도(레벨 공통 상수)

  return [
    { id: crypto.randomUUID(), level: nextLevel, x: balloon.x, y: balloon.y, vx: -splitVx, vy: -riseSpeed },
    { id: crypto.randomUUID(), level: nextLevel, x: balloon.x, y: balloon.y, vx: splitVx, vy: -riseSpeed },
  ]
}
```

- 분열된 두 풍선은 맞은 위치에서 동시에 생성되며, 좌/우로 반대 방향 수평 속도(`±120px/s`)를 갖고 해당 레벨의 `riseSpeed`만큼 위로 튀어 오른 뒤 `useBalloons`의 공통 중력/반사 로직을 그대로 따른다.
- Lv.1 풍선이 맞으면 빈 배열을 반환해 배열에서 제거되며, 완전 소멸 시 별도 이펙트(사운드/파티클)는 이번 Phase 범위 밖이다.

## 7. `useBalloons` 확장 (안)

- 기존 `useBalloonPhysics`의 중력/바닥·벽·천장 반사 로직(Phase 5, `src/game/useBalloonPhysics.ts:20-58`)을 **풍선 배열의 각 원소에 동일하게 적용**하도록 `map`으로 감싼다.
- 초기 상태는 `initialBalloons: BalloonState[]`를 인자로 받아 시작하며, Phase 6 검증 단계에서는 Lv.3 정도의 풍선 1개로 스테이지를 시작해 분열 과정을 관찰하기 쉽게 한다 (Mission 1 최종 난이도 수치는 Phase 11에서 조정).
- 외부(`GameScreen`)에서 충돌 결과를 반영할 수 있도록 `setBalloons`를 그대로 반환한다.

## 8. 스타일링

- `Balloon.css`는 변경하지 않는다. 다만 레벨에 따라 크기(반지름)만 달라지므로, 여러 레벨이 화면에 동시에 보일 때 시각적으로 크기 차이가 잘 드러나는지 정도만 확인한다.

## 9. 검증 방법 (Phase 6 완료 기준)

- `npm run dev` 실행 후 작살로 풍선을 맞췄을 때, Lv.4 → Lv.3 두 개, 다시 맞추면 Lv.3 → Lv.2 두 개... 순서로 정상적으로 갈라지는지 확인.
- 분열된 풍선 2개가 서로 반대 방향으로 자연스럽게 튕겨 나가는지 확인.
- 풍선을 맞춘 순간 작살이 화면에서 즉시 사라지는지(관통해서 다른 풍선까지 맞추지 않는지) 확인.
- 여러 풍선이 동시에 화면에 있을 때도 서로 독립적으로 물리 시뮬레이션되는지(서로 위치가 꼬이지 않는지) 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 10. Phase 7 연동을 위해 남겨두는 지점

- Phase 7(최소 크기 소멸 & 스테이지 클리어 감지)은 이번 Phase에서 이미 구현된 "Lv.1이면 빈 배열 반환(완전 소멸)" 로직을 그대로 사용하며, `balloons.length === 0`이 되는 시점을 감지해 클리어 상태로 전환하기만 하면 된다.
- `balloonLevels.ts`의 레벨 테이블은 Phase 11(Mission 1 난이도 적용)에서 시작 레벨/개수를 조정할 때 그대로 재사용한다.
