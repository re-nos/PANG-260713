import { useEffect } from 'react'
import './GameScreen.css'
import Player from '../game/Player'
import usePlayerMovement from '../game/usePlayerMovement'
import Wire from '../game/Wire'
import useWireLaunch from '../game/useWireLaunch'
import Balloon from '../game/Balloon'
import useBalloons from '../game/useBalloons'
import { getBalloonLevelConfig } from '../game/balloonLevels'
import splitBalloon from '../game/splitBalloon'
import ClearOverlay from '../game/ClearOverlay'

const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 60
const PLAYER_BOTTOM_OFFSET = 24
const PLAYER_LAUNCH_Y = window.innerHeight - PLAYER_BOTTOM_OFFSET - PLAYER_HEIGHT

const INITIAL_BALLOON_LEVEL = 3

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function GameScreen() {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)
  const [wire, dismissWire] = useWireLaunch(x, PLAYER_WIDTH, PLAYER_LAUNCH_Y)
  const [balloons, setBalloons] = useBalloons(window.innerWidth, window.innerHeight, [
    {
      id: crypto.randomUUID(),
      level: INITIAL_BALLOON_LEVEL,
      x: window.innerWidth / 2,
      y: getBalloonLevelConfig(INITIAL_BALLOON_LEVEL).radius * 2,
      vx: 160,
      vy: 0,
    },
  ])

  useEffect(() => {
    if (!wire) return

    const hitIndex = balloons.findIndex(
      (balloon) => distance(wire, balloon) <= getBalloonLevelConfig(balloon.level).radius,
    )
    if (hitIndex === -1) return

    setBalloons((prev) => prev.flatMap((balloon, i) => (i === hitIndex ? splitBalloon(balloon) : [balloon])))
    dismissWire()
  }, [wire, balloons, dismissWire, setBalloons])

  const isCleared = balloons.length === 0

  return (
    <div className="game-screen">
      <Player x={x} />
      {wire && <Wire x={wire.x} y={wire.y} />}
      {balloons.map((balloon) => (
        <Balloon
          key={balloon.id}
          x={balloon.x}
          y={balloon.y}
          radius={getBalloonLevelConfig(balloon.level).radius}
        />
      ))}
      {isCleared && <ClearOverlay />}
    </div>
  )
}

export default GameScreen
