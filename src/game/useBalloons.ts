import { useEffect, useState } from 'react'
import { getBalloonLevelConfig, type BalloonLevel } from './balloonLevels'

const GRAVITY = 900

export type BalloonState = {
  id: string
  level: BalloonLevel
  x: number
  y: number
  vx: number
  vy: number
}

function useBalloons(
  stageWidth: number,
  stageHeight: number,
  initial: BalloonState[],
  speedScale = 1,
) {
  const [balloons, setBalloons] = useState(initial)

  useEffect(() => {
    let raf: number
    let lastTime = performance.now()

    const tick = (time: number) => {
      const dt = ((time - lastTime) / 1000) * speedScale
      lastTime = time

      setBalloons((prev) =>
        prev.map((balloon) => {
          const { radius } = getBalloonLevelConfig(balloon.level)
          let { x, y, vx, vy } = balloon
          vy += GRAVITY * dt
          x += vx * dt
          y += vy * dt

          if (y + radius >= stageHeight) {
            y = stageHeight - radius
            vy = -vy
          }
          if (y - radius <= 0) {
            y = radius
            vy = -vy
          }
          if (x - radius <= 0) {
            x = radius
            vx = -vx
          }
          if (x + radius >= stageWidth) {
            x = stageWidth - radius
            vx = -vx
          }

          return { ...balloon, x, y, vx, vy }
        }),
      )
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [stageWidth, stageHeight, speedScale])

  return [balloons, setBalloons] as const
}

export default useBalloons
