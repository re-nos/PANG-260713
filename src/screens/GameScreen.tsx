import { useState } from 'react'
import GameStage from '../game/GameStage'
import GameOverOverlay from '../game/GameOverOverlay'

const INITIAL_LIVES = 3

function GameScreen() {
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [stageKey, setStageKey] = useState(0)

  const handlePlayerHit = () => {
    setLives((prev) => {
      const next = prev - 1
      if (next > 0) setStageKey((k) => k + 1)
      return next
    })
  }

  if (lives <= 0) {
    return <GameOverOverlay />
  }

  return <GameStage key={stageKey} lives={lives} onPlayerHit={handlePlayerHit} />
}

export default GameScreen
