// Normalize a finite nonzero direction without importing an engine vector library.
export function unitDirection (value) {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) throw new Error('Expected three finite direction components')
  const length = Math.hypot(...value)
  if (!Number.isFinite(length) || length < 1e-12) throw new Error('Direction must be nonzero and finite')
  return value.map(component => component / length)
}

// Validate semantic front and up directions as an orthogonal local basis.
export function orientationBasis (value) {
  const front = unitDirection(value.front)
  const up = unitDirection(value.up)
  if (Math.abs(front.reduce((sum, component, axis) => sum + component * up[axis], 0)) > 1e-6) throw new Error('Front and up must be perpendicular')
  return { front, up }
}

// Measure an unsigned Euclidean angle using clamped normalized vector components.
export function directionAngle (a, b) {
  const first = unitDirection(a)
  const second = unitDirection(b)
  const radians = Math.acos(Math.min(1, Math.max(-1, first.reduce((sum, value, axis) => sum + value * second[axis], 0))))
  return { radians, degrees: radians * 180 / Math.PI }
}
