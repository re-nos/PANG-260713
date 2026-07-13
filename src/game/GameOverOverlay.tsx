import './GameOverOverlay.css'

function GameOverOverlay() {
  return (
    <div className="game-over-overlay">
      <p className="game-over-overlay__title">GAME OVER</p>
      <p className="game-over-overlay__hint">새로고침(F5) 후 다시 도전해 주세요.</p>
    </div>
  )
}

export default GameOverOverlay
