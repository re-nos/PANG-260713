import { useState } from 'react'
import GameStage from '../game/GameStage'
import GameOverOverlay from '../game/GameOverOverlay'
import ClearOverlay from '../game/ClearOverlay'

const INITIAL_LIVES = 3

type Phase = 'playing' | 'cleared' | 'gameover'

type GameScreenProps = {
  onExitToMain: () => void
}

function GameScreen({ onExitToMain }: GameScreenProps) {
  const [phase, setPhase] = useState<Phase>('playing')
  const [lives, setLives] = useState(INITIAL_LIVES)
  const [stageKey, setStageKey] = useState(0)

  const handlePlayerHit = () => {
    setLives((prev) => {
      const next = prev - 1
      if (next > 0) {
        setStageKey((k) => k + 1)
      } else {
        setPhase('gameover')
      }
      return next
    })
  }

  const handleCleared = () => setPhase('cleared')

  if (phase === 'gameover') {
    return <GameOverOverlay onConfirm={onExitToMain} />
  }

  if (phase === 'cleared') {
    return <ClearOverlay onConfirm={onExitToMain} />
  }

  return (
    <GameStage key={stageKey} lives={lives} onPlayerHit={handlePlayerHit} onCleared={handleCleared} />
  )
}

export default GameScreen
