// Validate a compact open polyline and derive segment subdivision counts without storing every generated post.
function segments (generator) {
  if (!Array.isArray(generator.points) || generator.points.length < 2 || !Number.isFinite(generator.maxSpacing) || generator.maxSpacing <= 0) throw new Error('Polyline needs points and positive maxSpacing')
  for (const point of generator.points) if (!Array.isArray(point) || point.length !== 3 || !point.every(Number.isFinite)) throw new Error('Invalid polyline point')
  return generator.points.slice(1).map((point, index) => {
    const start = generator.points[index]
    const length = Math.hypot(...point.map((value, axis) => value - start[axis]))
    if (length < 1e-8) throw new Error('Polyline has a zero-length segment')
    return { start, end: point, steps: Math.ceil(length / generator.maxSpacing) }
  })
}

// Count members from the path recipe rather than persisting an instance list in the semantic index.
export function polylineCount (generator) {
  const count = 1 + segments(generator).reduce((sum, segment) => sum + segment.steps, 0)
  if (count > 100000) throw new Error('Polyline exceeds 100000 members')
  return count
}

// Resolve one path station with shared endpoints and a single intentional opening between the path ends.
export function polylinePoint (generator, index) {
  if (!Number.isInteger(index) || index < 0) throw new Error('Invalid polyline member index')
  let remaining = index
  for (const segment of segments(generator)) {
    if (remaining <= segment.steps) return segment.start.map((value, axis) => value + (segment.end[axis] - value) * remaining / segment.steps)
    remaining -= segment.steps
  }
  throw new Error('Polyline member index out of range')
}
