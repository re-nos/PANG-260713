import { useEffect, useRef, useState } from 'react'

type Facing = 'left' | 'right'

type ObstacleRange = {
  left: number
  right: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function resolveObstacles(x: number, playerWidth: number, obstacles: ObstacleRange[]) {
  let resolved = x
  for (const obstacle of obstacles) {
    const overlaps = resolved < obstacle.right && resolved + playerWidth > obstacle.left
    if (!overlaps) continue
    const playerCenter = resolved + playerWidth / 2
    const obstacleCenter = (obstacle.left + obstacle.right) / 2
    resolved = playerCenter < obstacleCenter ? obstacle.left - playerWidth : obstacle.right
  }
  return resolved
}

function usePlayerMovement(
  stageWidth: number,
  playerWidth: number,
  speed = 240,
  obstacles: ObstacleRange[] = [],
) {
  const [x, setX] = useState(() => (stageWidth - playerWidth) / 2)
  const [facing, setFacing] = useState<Facing>('right')
  const obstaclesRef = useRef(obstacles)
  obstaclesRef.current = obstacles

  useEffect(() => {
    setX((prev) => clamp(prev, 0, stageWidth - playerWidth))
  }, [stageWidth, playerWidth])

  useEffect(() => {
    const pressed = { left: false, right: false }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') pressed.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') pressed.right = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') pressed.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') pressed.right = false
    }

    let raf: number
    let lastTime = performance.now()

    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time
      const dir = (pressed.right ? 1 : 0) - (pressed.left ? 1 : 0)
      if (dir !== 0) {
        setFacing(dir > 0 ? 'right' : 'left')
        setX((prev) => {
          const next = clamp(prev + dir * speed * dt, 0, stageWidth - playerWidth)
          return resolveObstacles(next, playerWidth, obstaclesRef.current)
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [stageWidth, playerWidth, speed])

  return { x, facing }
}

export default usePlayerMovement
