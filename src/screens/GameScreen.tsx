import './GameScreen.css'
import Player from '../game/Player'
import usePlayerMovement from '../game/usePlayerMovement'
import Wire from '../game/Wire'
import useWireLaunch from '../game/useWireLaunch'
import Balloon from '../game/Balloon'
import useBalloonPhysics from '../game/useBalloonPhysics'

const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 60
const PLAYER_BOTTOM_OFFSET = 24
const PLAYER_LAUNCH_Y = window.innerHeight - PLAYER_BOTTOM_OFFSET - PLAYER_HEIGHT

const BALLOON_RADIUS = 48

function GameScreen() {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)
  const wire = useWireLaunch(x, PLAYER_WIDTH, PLAYER_LAUNCH_Y)
  const balloon = useBalloonPhysics(window.innerWidth, window.innerHeight, BALLOON_RADIUS, {
    x: window.innerWidth / 2,
    y: BALLOON_RADIUS * 2,
    vx: 160,
    vy: 0,
  })

  return (
    <div className="game-screen">
      <Player x={x} />
      {wire && <Wire x={wire.x} y={wire.y} />}
      <Balloon x={balloon.x} y={balloon.y} radius={BALLOON_RADIUS} />
    </div>
  )
}

export default GameScreen
