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

export type Obstacle = {
  left: number
  top: number
  right: number
  bottom: number
}

export function createMission1Obstacles(stageWidth: number, stageHeight: number): Obstacle[] {
  const groundLine = stageHeight - 24

  const platformWidth = 160
  const platformLeft = stageWidth * 0.55
  const platformTop = stageHeight * 0.4

  const pillarWidth = 36
  const pillarHeight = 90
  const pillarLeft = stageWidth * 0.15

  return [
    {
      left: platformLeft,
      top: platformTop,
      right: platformLeft + platformWidth,
      bottom: platformTop + 24,
    },
    {
      left: pillarLeft,
      top: groundLine - pillarHeight,
      right: pillarLeft + pillarWidth,
      bottom: groundLine,
    },
  ]
}
