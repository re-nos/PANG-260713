import { useEffect, useRef, useState } from 'react'

type Wire = {
  x: number
  y: number
}

function useWireLaunch(playerX: number, playerWidth: number, launchY: number, speed = 480) {
  const [wire, setWire] = useState<Wire | null>(null)
  const wireRef = useRef(wire)
  wireRef.current = wire

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (wireRef.current) return
      setWire({ x: playerX + playerWidth / 2, y: launchY })
    }

    let raf: number
    let lastTime = performance.now()

    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time
      setWire((prev) => {
        if (!prev) return prev
        const nextY = prev.y - speed * dt
        return nextY <= 0 ? null : { ...prev, y: nextY }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [playerX, playerWidth, launchY, speed])

  return wire
}

export default useWireLaunch
