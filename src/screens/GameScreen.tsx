import { useState } from 'react'
import GameStage from '../game/GameStage'
import GameOverOverlay from '../game/GameOverOverlay'

const INITIAL_LIVES = 3

type GameScreenProps = {
  onExitToMain: () => void
}

function GameScreen({ onExitToMain }: GameScreenProps) {
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
    return <GameOverOverlay onConfirm={onExitToMain} />
  }

  return <GameStage key={stageKey} lives={lives} onPlayerHit={handlePlayerHit} />
}

export default GameScreen
