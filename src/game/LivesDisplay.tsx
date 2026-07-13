import './LivesDisplay.css'

type LivesDisplayProps = {
  lives: number
}

function LivesDisplay({ lives }: LivesDisplayProps) {
  return (
    <div className="lives-display">
      {Array.from({ length: lives }, (_, i) => (
        <span key={i} className="lives-display__icon">
          ♥
        </span>
      ))}
    </div>
  )
}

export default LivesDisplay
