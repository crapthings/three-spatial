// Normalize scene-wide measurement conventions while preserving explicit unknown physical scale.
export function coordinateConvention (input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected coordinate metadata')
  const legacyMeter = ['meter', 'meters'].includes(input.unit)
  const metersPerUnit = Object.hasOwn(input, 'metersPerUnit') ? input.metersPerUnit : legacyMeter ? 1 : null
  if (metersPerUnit !== null && (!Number.isFinite(metersPerUnit) || metersPerUnit <= 0)) throw new Error('metersPerUnit must be positive or null')
  if (legacyMeter && metersPerUnit !== 1) throw new Error('Legacy meter unit conflicts with metersPerUnit')
  if (input.unit !== undefined && !['scene-unit', 'meter', 'meters'].includes(input.unit)) throw new Error('Use scene-unit with an explicit metersPerUnit')
  const convention = { dimensions: input.dimensions ?? 3, unit: 'scene-unit', metersPerUnit, handedness: input.handedness ?? 'right', up: input.up ?? '+Y', frame: input.frame ?? 'scene' }
  if (convention.dimensions !== 3 || !['right', 'left'].includes(convention.handedness) || !['+X', '-X', '+Y', '-Y', '+Z', '-Z'].includes(convention.up) || typeof convention.frame !== 'string' || !convention.frame) throw new Error('Invalid coordinate convention')
  return convention
}

// Convert explicit lengths without inferring a physical scale from object transforms or visual style.
export function convertLength (value, from, to, coordinates) {
  if (!['scene-unit', 'meter'].includes(from) || !['scene-unit', 'meter'].includes(to)) throw new Error('Length units must be scene-unit or meter')
  const convention = coordinateConvention(coordinates)
  if (from !== to && convention.metersPerUnit === null) throw new Error('Physical scale is unknown; meter conversion is unavailable')
  const ratio = from === to ? 1 : from === 'scene-unit' ? convention.metersPerUnit : 1 / convention.metersPerUnit
  const convert = number => {
    if (!Number.isFinite(number) || !Number.isFinite(number * ratio)) throw new Error('Expected a finite convertible length')
    return number * ratio
  }
  return Array.isArray(value) ? value.map(convert) : convert(value)
}

// Validate compact dimension intent and style policy independently of any geometry implementation.
export function validateSpatialIntent (value) {
  const positiveSize = size => {
    if (!Array.isArray(size) || size.length !== 3 || !size.every(number => Number.isFinite(number) && number > 0)) throw new Error('Size must contain three positive numbers in X/Y/Z order')
  }
  if (value.dimensions !== undefined) {
    const dimensions = value.dimensions
    if (!dimensions || typeof dimensions !== 'object' || Array.isArray(dimensions)) throw new Error('Invalid dimension intent')
    if (dimensions.design) {
      positiveSize(dimensions.design.size)
      if (dimensions.design.unit !== 'scene-unit' || typeof dimensions.design.frame !== 'string' || !dimensions.design.frame || typeof dimensions.design.scope !== 'string' || !dimensions.design.scope) throw new Error('Design dimensions need scene-unit, frame, and scope')
    }
    if (dimensions.functional !== undefined) {
      if (!Array.isArray(dimensions.functional)) throw new Error('Functional dimensions must be an array')
      for (const constraint of dimensions.functional) {
        if (typeof constraint.id !== 'string' || !constraint.id || constraint.unit !== 'scene-unit' || typeof constraint.frame !== 'string' || !constraint.frame) throw new Error('Functional dimensions need an ID, frame and unit')
        positiveSize(constraint.minimumSize)
      }
    }
    if (dimensions.edit !== undefined && !['generator', 'source-code', 'uniform-scale', 'none'].includes(dimensions.edit.mode)) throw new Error('Invalid size edit mode')
  }
  if (value.style !== undefined) {
    const style = value.style
    if (!style || typeof style !== 'object' || Array.isArray(style)) throw new Error('Style policy must be an object')
    if (style.geometry !== undefined && (typeof style.geometry !== 'string' || !style.geometry)) throw new Error('Invalid geometry style')
    if (style.proportions !== undefined && !['realistic', 'stylized', 'unspecified'].includes(style.proportions)) throw new Error('Invalid proportion policy')
    for (const key of ['adjustable', 'preserve']) {
      if (style[key] !== undefined && (!Array.isArray(style[key]) || !style[key].every(item => typeof item === 'string' && item))) throw new Error(`Invalid style ${key} list`)
    }
  }
}

// Resolve effective style by semantic ancestry; protection lists accumulate while other fields override.
export function spatialIntent (index, id) {
  const parts = new Map(index.parts.map(part => [part.id, part]))
  const part = parts.get(id)
  if (!part) throw new Error('Unknown semantic part ID')
  const chain = []
  const seen = new Set()
  let current = part
  while (current) {
    if (seen.has(current.id)) throw new Error('Composition cycle')
    seen.add(current.id)
    chain.unshift(current)
    current = parts.get(current.partOf)
  }
  const style = {}
  const sources = []
  for (const item of [{ id: 'scene', style: index.style }, ...chain]) {
    if (!item.style) continue
    const preserve = [...new Set([...(style.preserve ?? []), ...(item.style.preserve ?? [])])]
    Object.assign(style, structuredClone(item.style))
    style.preserve = preserve
    sources.push(item.id)
  }
  if (style.adjustable) style.adjustable = style.adjustable.filter(value => !(style.preserve ?? []).includes(value))
  return { coordinates: coordinateConvention(index.coordinates), part: id, dimensions: structuredClone(part.dimensions ?? null), style, styleSources: sources, policy: 'Style is declared intent, not an automatic resize instruction; functional constraints take precedence.' }
}
