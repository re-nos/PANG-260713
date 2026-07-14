export const BALLOON_LEVELS = [
  { level: 1, radius: 20, riseSpeed: 320 },
  { level: 2, radius: 40, riseSpeed: 400 },
  { level: 3, radius: 64, riseSpeed: 480 },
] as const

export const MAX_BALLOON_LEVEL = 3

export type BalloonLevel = (typeof BALLOON_LEVELS)[number]['level']

export function getBalloonLevelConfig(level: BalloonLevel) {
  return BALLOON_LEVELS[level - 1]
}
