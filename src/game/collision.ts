export function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function circleIntersectsRect(
  circle: { x: number; y: number; radius: number },
  rect: { left: number; top: number; right: number; bottom: number },
) {
  const closestX = Math.max(rect.left, Math.min(circle.x, rect.right))
  const closestY = Math.max(rect.top, Math.min(circle.y, rect.bottom))
  return distance(circle, { x: closestX, y: closestY }) <= circle.radius
}

export function pointInRect(
  point: { x: number; y: number },
  rect: { left: number; top: number; right: number; bottom: number },
) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
}
