import './Player.css'

type PlayerProps = {
  x: number
}

function Player({ x }: PlayerProps) {
  return <div className="player" style={{ transform: `translateX(${x}px)` }} />
}

export default Player
