import { useEffect, useState } from 'react'

const GRAVITY = 900

type BalloonState = {
  x: number
  y: number
  vx: number
  vy: number
}

function useBalloonPhysics(
  stageWidth: number,
  stageHeight: number,
  radius: number,
  initial: BalloonState,
) {
  const [balloon, setBalloon] = useState(initial)

  useEffect(() => {
    let raf: number
    let lastTime = performance.now()

    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time

      setBalloon((prev) => {
        let { x, y, vx, vy } = prev
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

        return { x, y, vx, vy }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [stageWidth, stageHeight, radius])

  return balloon
}

export default useBalloonPhysics
