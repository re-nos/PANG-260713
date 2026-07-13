# DESIGN — Phase 11: Mission 1 난이도 적용

`docs/PLAN.md`의 Phase 11(Mission 1 난이도 적용) 구현을 위한 설계 문서입니다. 이 Phase의 목표는 "첫 스테이지로서 난이도가 적절한지"와 "조정된 수치가 실제 플레이에서 의도한 대로 체감되는지"를 검증하는 것이며, `docs/FEATURES/mission1.md`에 정의된 난이도 기준을 지금까지 만들어온 엔진(캐릭터/작살/풍선/생명)에 실제 수치로 반영한다.

## 1. 범위

**포함**
- `docs/FEATURES/mission1.md` 2장의 난이도 표를 실제 코드 상수로 반영: 풍선 개수(1~2개), 최대 크기(Lv.2~3), 이동 속도(느림).
- Phase 5~6에서 엔진 검증용으로 임시로 넣어둔 하드코딩 값(`INITIAL_BALLOON_LEVEL = 3`, 초기 풍선 1개, 속도 상수 등)을 "Mission 설정"이라는 별도 단위로 분리.

**이미 충족되어 손댈 필요가 없는 항목 (재확인만)**
- 지형: 사다리/장애물 자체가 아직 구현되어 있지 않으므로 "평지 위주" 요건은 자동으로 만족.
- 파워업 등장 여부: 파워업 시스템 자체가 아직 없으므로 "등장하지 않음" 요건은 자동으로 만족.
- 제한 시간: 타이머 자체가 없으므로 "제한 시간 없음" 요건은 자동으로 만족.

**제외**
- 실제 파워업/타이머 시스템 구현 (향후 확장 범위, `docs/FEATURES/mission1.md` 6장)
- Mission 2 이후의 난이도 설계 (이번 Phase는 Mission 1 값만 다룬다)

## 2. 현재 상태 — 이번 Phase에서 바뀌는 부분

풍선 시작 구성이 `GameStage` 내부에 하드코딩되어 있고, 이동 속도는 Phase 5~6에서 물리 엔진 검증을 위해 임의로 정한 값(중력 900px/s², Lv.3 리프트 속도 440px/s 등)이라 "느림"이라는 Mission 1의 체감 목표와 맞는지 검증된 적이 없다.

| 항목 | 기존 (Phase 5~10) | Mission 1 반영 후 |
|---|---|---|
| 초기 풍선 구성 | `GameStage.tsx`에 Lv.3 풍선 1개가 하드코딩 (`src/game/GameStage.tsx:20,30-39`) | `mission1.ts` 설정 파일에서 주입 |
| 풍선 이동 속도 | `useBalloons`의 `GRAVITY = 900` 고정, 레벨별 속도는 `balloonLevels.ts` 값 그대로 사용 (`src/game/useBalloons.ts:4`) | `useBalloons`에 `speedScale` 옵션 추가, Mission 1은 느리게(예: `0.6`) 적용 |

## 3. Mission 설정 모듈 도입

앞으로 Mission 2, 3...이 추가될 것을 고려해, "이 스테이지에 어떤 풍선이 몇 개, 어떤 속도로 등장하는가"를 `GameStage`에 하드코딩하지 않고 **Mission 설정 객체**로 분리한다.

```
src/game/
└─ missions/
    └─ mission1.ts   (신규)
```

```ts
// src/game/missions/mission1.ts
import type { BalloonState } from '../useBalloons'
import { getBalloonLevelConfig } from '../balloonLevels'

export const MISSION_1_SPEED_SCALE = 0.6 // 체감 속도 조절 배수(느리게). 플레이테스트 후 조정 예정.

export function createMission1Balloons(stageWidth: number): BalloonState[] {
  const level = 2 // Lv.2~3 범위 중 초심자 스테이지이므로 낮은 쪽(Lv.2)을 기본값으로 선택
  const radius = getBalloonLevelConfig(level).radius

  return [
    {
      id: crypto.randomUUID(),
      level,
      x: stageWidth / 2,
      y: radius * 2,
      vx: 100,
      vy: 0,
    },
  ]
}
```

- **풍선 개수(1개) 및 레벨(Lv.2) 선택 근거**: `docs/FEATURES/mission1.md`는 "1~2개, Lv.2~3" 범위로 폭을 두고 있고 "구체적인 수치는 플레이테스트를 거쳐 조정될 수 있다"고 명시하고 있다. 첫 스테이지를 짧고 확실하게 클리어시키는 것이 목표이므로, 분열까지 포함해도 화면에 풍선이 너무 많아지지 않는 **Lv.2 풍선 1개**를 기본값으로 선택했다. 플레이 테스트 결과 너무 쉽다면 Lv.3 또는 2개로 조정한다.
- **수평 속도(100px/s)**: Phase 5~6에서 검증용으로 쓰던 160px/s보다 낮춰, 첫 인상부터 "느리다"는 체감을 주도록 한다.

## 4. `useBalloons`에 속도 배율(`speedScale`) 추가

Mission별로 "풍선이 얼마나 빠르게 움직이는가"를 조절할 수 있는 가장 단순한 방법은, 물리 계산에 들어가는 시간(`dt`)에 배율을 곱하는 것이다. 중력·속도 값을 개별적으로 다시 튜닝하지 않고도 궤적의 "모양"은 그대로 유지한 채 전체 움직임만 느리게/빠르게 만들 수 있다.

```ts
// src/game/useBalloons.ts (수정 방향)
function useBalloons(
  stageWidth: number,
  stageHeight: number,
  initial: BalloonState[],
  speedScale = 1,
) {
  // ...
  const tick = (time: number) => {
    const dt = ((time - lastTime) / 1000) * speedScale
    lastTime = time
    // ...기존 물리 계산은 동일...
  }
  // ...
}
```

- `speedScale`을 생략하면 기존 동작(1배)과 동일하므로, Phase 5~6에서 이미 구현된 로직을 깨뜨리지 않는다.
- 분열로 새로 생기는 풍선(`splitBalloon`)도 같은 `useBalloons` 루프 안에서 시뮬레이션되므로, 별도 처리 없이 동일한 `speedScale`이 자동으로 적용된다.

## 5. `GameStage` / `GameScreen` 연동 (안)

```tsx
// src/game/GameStage.tsx (수정 방향)
import { MISSION_1_SPEED_SCALE, createMission1Balloons } from './missions/mission1'

function GameStage({ lives, onPlayerHit }: GameStageProps) {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)
  const [wire, dismissWire] = useWireLaunch(x, PLAYER_WIDTH, PLAYER_LAUNCH_Y)
  const [balloons, setBalloons] = useBalloons(
    window.innerWidth,
    window.innerHeight,
    createMission1Balloons(window.innerWidth),
    MISSION_1_SPEED_SCALE,
  )
  // ...나머지 로직은 기존과 동일...
}
```

- `INITIAL_BALLOON_LEVEL` 상수와 인라인 초기 배열(`src/game/GameStage.tsx:20,30-39`)은 제거하고 `createMission1Balloons` 호출로 대체한다.
- 이번 Phase에서는 `GameStage`가 `mission1` 설정을 직접 import하는 가장 단순한 형태로 연결한다. Mission이 여러 개로 늘어나는 시점(Mission 1 완성 이후)에는 `GameStage`가 `mission` 객체를 prop으로 받는 형태로 한 단계 더 일반화할 수 있으나, 이번 Phase는 Mission 1 단일 스테이지만 다루므로 범위를 넘는 추상화는 하지 않는다.

## 6. 스타일링

- 변경 없음. 수치 조정만 다루는 Phase이다.

## 7. 검증 방법 (Phase 11 완료 기준)

- `npm run dev` 실행 후 풍선이 이전보다 눈에 띄게 느리게 움직이는지 확인.
- 화면에 동시에 존재하는 풍선 수가 과하지 않은지(분열을 포함해도 정신없이 많아지지 않는지) 확인.
- 처음 플레이하는 사람이 few번의 시도 안에 클리어할 수 있는 수준인지 확인 (너무 쉽거나 너무 어렵지 않은지 고객님의 주관적 판단).
- 기존 Phase 6~9에서 확인했던 분열/접촉/생명 로직이 속도 변경 후에도 동일하게 동작하는지 회귀 확인.
- `npm run build`, `npm run lint` 통과 확인.

## 8. Phase 12 연동을 위해 남겨두는 지점

- 이번 Phase에서 만든 `mission1.ts`와 `useBalloons`의 `speedScale` 매개변수는 Phase 12(Mission 1 전체 플레이 루프 완성)에서 별도 수정 없이 그대로 사용된다.
- 이후 Mission 2 이상이 추가될 때는 `mission2.ts` 등을 같은 패턴으로 추가하고, `GameStage`가 어떤 Mission 설정을 쓸지 prop으로 주입받도록 확장하는 리팩터링을 검토한다 (현재는 범위 밖).
