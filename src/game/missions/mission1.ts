import type { BalloonState } from '../useBalloons'
import { getBalloonLevelConfig, type BalloonLevel } from '../balloonLevels'

export const MISSION_1_SPEED_SCALE = 0.6

export function createMission1Balloons(stageWidth: number): BalloonState[] {
  const level: BalloonLevel = 3
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
