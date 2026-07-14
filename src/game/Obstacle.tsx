import './Obstacle.css'
import type { Obstacle as ObstacleData } from './missions/mission1'

type ObstacleProps = {
  obstacle: ObstacleData
}

function Obstacle({ obstacle }: ObstacleProps) {
  return (
    <div
      className="obstacle"
      style={{
        left: obstacle.left,
        top: obstacle.top,
        width: obstacle.right - obstacle.left,
        height: obstacle.bottom - obstacle.top,
      }}
    />
  )
}

export default Obstacle
