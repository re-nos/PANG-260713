import { useState } from 'react'
import GameStage from '../game/GameStage'

function GameScreen() {
  const [stageKey, setStageKey] = useState(0)

  return <GameStage key={stageKey} onPlayerHit={() => setStageKey((k) => k + 1)} />
}

export default GameScreen
