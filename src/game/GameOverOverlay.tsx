import './GameOverOverlay.css'

type GameOverOverlayProps = {
  onConfirm: () => void
}

function GameOverOverlay({ onConfirm }: GameOverOverlayProps) {
  return (
    <div className="game-over-overlay">
      <p className="game-over-overlay__title">GAME OVER</p>
      <button className="game-over-overlay__button" onClick={onConfirm}>
        메인 화면으로
      </button>
    </div>
  )
}

export default GameOverOverlay
