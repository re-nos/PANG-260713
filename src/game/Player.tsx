import './Player.css'

type PlayerProps = {
  x: number
  facing: 'left' | 'right'
}

function Player({ x, facing }: PlayerProps) {
  return (
    <div
      className="player"
      style={{
        transform: `translateX(${x}px) scaleX(${facing === 'left' ? -1 : 1})`,
      }}
    >
      <svg viewBox="0 0 40 60" className="player__svg">
        <circle cx="20" cy="12" r="10" className="player__head" />
        <rect x="10" y="22" width="20" height="26" rx="4" className="player__body" />
        <line x1="10" y1="30" x2="2" y2="40" className="player__limb" />
        <line x1="30" y1="30" x2="38" y2="40" className="player__limb" />
        <line x1="15" y1="48" x2="12" y2="60" className="player__limb" />
        <line x1="25" y1="48" x2="28" y2="60" className="player__limb" />
      </svg>
    </div>
  )
}

export default Player
