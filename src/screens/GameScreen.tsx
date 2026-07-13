import './GameScreen.css'
import Player from '../game/Player'
import usePlayerMovement from '../game/usePlayerMovement'

const PLAYER_WIDTH = 40

function GameScreen() {
  const x = usePlayerMovement(window.innerWidth, PLAYER_WIDTH)

  return (
    <div className="game-screen">
      <Player x={x} />
    </div>
  )
}

export default GameScreen
