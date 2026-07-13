import './Balloon.css'

type BalloonProps = {
  x: number
  y: number
  radius: number
}

function Balloon({ x, y, radius }: BalloonProps) {
  const size = radius * 2

  return (
    <div
      className="balloon"
      style={{
        width: size,
        height: size,
        transform: `translate(${x - radius}px, ${y - radius}px)`,
      }}
    />
  )
}

export default Balloon
