import { useEffect } from 'react'
import '../screens/GameScreen.css'
import Player from './Player'
import usePlayerMovement from './usePlayerMovement'
import Wire from './Wire'
import useWireLaunch from './useWireLaunch'
import Balloon from './Balloon'
import useBalloons from './useBalloons'
import { getBalloonLevelConfig } from './balloonLevels'
import splitBalloon from './splitBalloon'
import LivesDisplay from './LivesDisplay'
import { distance, circleIntersectsRect } from './collision'
import { MISSION_1_SPEED_SCALE, createMission1Balloons } from './missions/mission1'

const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 60
const PLAYER_BOTTOM_OFFSET = 24
const PLAYER_LAUNCH_Y = window.innerHeight - PLAYER_BOTTOM_OFFSET - PLAYER_HEIGHT

type GameStageProps = {
  lives: number
  onPlayerHit: () => void
  onCleared: () => void
}

function GameStage({ lives, onPlayerHit, onCleared }: GameStageProps) {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)
  const [wire, dismissWire] = useWireLaunch(x, PLAYER_WIDTH, PLAYER_LAUNCH_Y)
  const [balloons, setBalloons] = useBalloons(
    window.innerWidth,
    window.innerHeight,
    createMission1Balloons(window.innerWidth),
    MISSION_1_SPEED_SCALE,
  )

  useEffect(() => {
    if (!wire) return

    const hitIndex = balloons.findIndex(
      (balloon) => distance(wire, balloon) <= getBalloonLevelConfig(balloon.level).radius,
    )
    if (hitIndex === -1) return

    setBalloons((prev) => prev.flatMap((balloon, i) => (i === hitIndex ? splitBalloon(balloon) : [balloon])))
    dismissWire()
  }, [wire, balloons, dismissWire, setBalloons])

  useEffect(() => {
    const playerRect = {
      left: x,
      right: x + PLAYER_WIDTH,
      top: PLAYER_LAUNCH_Y,
      bottom: PLAYER_LAUNCH_Y + PLAYER_HEIGHT,
    }
    const isHit = balloons.some((balloon) =>
      circleIntersectsRect(
        { x: balloon.x, y: balloon.y, radius: getBalloonLevelConfig(balloon.level).radius },
        playerRect,
      ),
    )
    if (isHit) onPlayerHit()
  }, [x, balloons, onPlayerHit])

  const isCleared = balloons.length === 0

  useEffect(() => {
    if (isCleared) onCleared()
  }, [isCleared, onCleared])

  return (
    <div className="game-screen">
      <LivesDisplay lives={lives} />
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
    </div>
  )
}

export default GameStage
