import type { BalloonState } from './useBalloons'
import { getBalloonLevelConfig } from './balloonLevels'

const SPLIT_VX = 120

function splitBalloon(balloon: BalloonState): BalloonState[] {
  if (balloon.level <= 1) return []

  const nextLevel = (balloon.level - 1) as BalloonState['level']
  const { riseSpeed } = getBalloonLevelConfig(nextLevel)

  return [
    {
      id: crypto.randomUUID(),
      level: nextLevel,
      x: balloon.x,
      y: balloon.y,
      vx: -SPLIT_VX,
      vy: -riseSpeed,
    },
    {
      id: crypto.randomUUID(),
      level: nextLevel,
      x: balloon.x,
      y: balloon.y,
      vx: SPLIT_VX,
      vy: -riseSpeed,
    },
  ]
}

export default splitBalloon
