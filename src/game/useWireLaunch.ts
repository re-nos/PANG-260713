import { useCallback, useEffect, useRef, useState } from 'react'

type WirePhase = 'out' | 'back'

type Wire = {
  x: number
  y: number
  phase: WirePhase
}

function useWireLaunch(playerX: number, playerWidth: number, launchY: number, speed = 480) {
  const [wire, setWire] = useState<Wire | null>(null)
  const wireRef = useRef(wire)
  wireRef.current = wire
  const playerXRef = useRef(playerX)
  playerXRef.current = playerX

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (wireRef.current) return
      setWire({ x: playerXRef.current + playerWidth / 2, y: launchY, phase: 'out' })
    }

    let raf: number
    let lastTime = performance.now()

    const tick = (time: number) => {
      const dt = (time - lastTime) / 1000
      lastTime = time
      setWire((prev) => {
        if (!prev) return prev

        if (prev.phase === 'out') {
          const nextY = prev.y - speed * dt
          if (nextY <= 0) return { ...prev, y: 0, phase: 'back' }
          return { ...prev, y: nextY }
        }

        const nextY = prev.y + speed * dt
        if (nextY >= launchY) return null
        return { x: playerXRef.current + playerWidth / 2, y: nextY, phase: 'back' }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [playerWidth, launchY, speed])

  const dismissWire = useCallback(() => setWire(null), [])

  return [wire, dismissWire] as const
}

export default useWireLaunch
