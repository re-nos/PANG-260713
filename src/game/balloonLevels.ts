export const BALLOON_LEVELS = [
  { level: 1, radius: 12, riseSpeed: 280 },
  { level: 2, radius: 24, riseSpeed: 360 },
  { level: 3, radius: 36, riseSpeed: 440 },
  { level: 4, radius: 48, riseSpeed: 520 },
] as const

export const MAX_BALLOON_LEVEL = 4

export type BalloonLevel = (typeof BALLOON_LEVELS)[number]['level']

export function getBalloonLevelConfig(level: BalloonLevel) {
  return BALLOON_LEVELS[level - 1]
}
