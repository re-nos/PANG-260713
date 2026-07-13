import './GameScreen.css'
import Player from '../game/Player'
import usePlayerMovement from '../game/usePlayerMovement'
import Wire from '../game/Wire'
import useWireLaunch from '../game/useWireLaunch'

const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 60
const PLAYER_BOTTOM_OFFSET = 24
const PLAYER_LAUNCH_Y = window.innerHeight - PLAYER_BOTTOM_OFFSET - PLAYER_HEIGHT

function GameScreen() {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)
  const wire = useWireLaunch(x, PLAYER_WIDTH, PLAYER_LAUNCH_Y)

  return (
    <div className="game-screen">
      <Player x={x} />
      {wire && <Wire x={wire.x} y={wire.y} />}
    </div>
  )
}

export default GameScreen
