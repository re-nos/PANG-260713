import { useEffect, useState } from 'react'

type Facing = 'left' | 'right'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function usePlayerMovement(stageWidth: number, playerWidth: number, speed = 240) {
  const [x, setX] = useState(() => (stageWidth - playerWidth) / 2)
  const [facing, setFacing] = useState<Facing>('right')

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
        setX((prev) => clamp(prev + dir * speed * dt, 0, stageWidth - playerWidth))
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
