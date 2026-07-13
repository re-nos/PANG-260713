import './Wire.css'

type WireProps = {
  x: number
  y: number
}

function Wire({ x, y }: WireProps) {
  return <div className="wire" style={{ transform: `translate(${x}px, ${y}px)` }} />
}

export default Wire
