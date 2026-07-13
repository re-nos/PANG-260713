import './ClearOverlay.css'

type ClearOverlayProps = {
  onConfirm: () => void
}

function ClearOverlay({ onConfirm }: ClearOverlayProps) {
  return (
    <div className="clear-overlay">
      <p className="clear-overlay__text">CLEAR!</p>
      <button className="clear-overlay__button" onClick={onConfirm}>
        메인 화면으로
      </button>
    </div>
  )
}

export default ClearOverlay
