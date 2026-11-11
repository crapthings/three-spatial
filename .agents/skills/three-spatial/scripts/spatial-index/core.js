import { polylineCount, polylinePoint } from './patterns.js'
import { validateRelations } from './relations.js'
import { orientationBasis } from './directions.js'
import { coordinateConvention, convertLength, spatialIntent, validateSpatialIntent } from './contracts.js'

// Validate a compact semantic graph independently of rendering engines and geometry libraries.
export function validateIndex (index) {
  const errors = []
  if (index?.schemaVersion !== 1 || !Number.isInteger(index?.revision) || index.revision < 0 || !Array.isArray(index?.parts)) return { valid: false, errors: ['Expected schemaVersion 1, nonnegative revision, and parts array'] }
  if (index.coordinates?.dimensions !== undefined && index.coordinates.dimensions !== 3) errors.push('This version supports 3D generator coordinates only')
  try { coordinateConvention(index.coordinates); validateSpatialIntent(index) } catch (error) { errors.push(error.message) }
  const parts = new Map()
  for (const part of index.parts) {
    if (!part || typeof part.id !== 'string' || !part.id || parts.has(part.id)) { errors.push('Invalid or duplicate part ID'); continue }
    parts.set(part.id, part)
    if (!['assembly', 'component', 'procedural-set'].includes(part.kind)) errors.push(`Invalid kind: ${part.id}`)
    if (part.bindings && (!Array.isArray(part.bindings) || part.bindings.some(binding => !binding || typeof binding.objectName !== 'string'))) errors.push(`Invalid bindings: ${part.id}`)
    try { validateSpatialIntent(part) } catch (error) { errors.push(`${part.id}: ${error.message}`) }
    if (part.orientation) {
      try { orientationBasis(part.orientation) } catch (error) { errors.push(`${part.id}: ${error.message}`) }
    }
    if (part.kind === 'procedural-set') {
      try { memberCount(part.generator) } catch (error) { errors.push(`${part.id}: ${error.message}`) }
    }
  }
  for (const part of parts.values()) {
    if (part.partOf && !parts.has(part.partOf)) errors.push(`Missing parent: ${part.id}`)
    const seen = new Set([part.id])
    let parent = part.partOf
    while (parts.has(parent)) {
      if (seen.has(parent)) { errors.push(`Composition cycle: ${part.id}`); break }
      seen.add(parent)
      parent = parts.get(parent).partOf
    }
  }
  if (parts.size === index.parts.length) errors.push(...validateRelations(index))
  return { valid: errors.length === 0, errors, parts: parts.size }
}

// Require finite 3D coordinates without assuming any engine-specific vector representation.
function point (value) {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) throw new Error('Expected three finite coordinates')
  return value
}

// Check the supported generator recipes without materializing their members.
function memberCount (generator) {
  if (!generator || !['linear', 'placements', 'text', 'polyline'].includes(generator.type)) throw new Error('Unsupported generator type')
  if (generator.type === 'polyline') return polylineCount(generator)
  if (generator.type === 'placements') {
    if (!Array.isArray(generator.items) || generator.items.length > 100000) throw new Error('Invalid placements')
    const keys = new Set()
    for (const item of generator.items) {
      if (typeof item.key !== 'string' || !item.key || keys.has(item.key)) throw new Error('Invalid or duplicate placement key')
      keys.add(item.key)
      point(item.position)
    }
    return generator.items.length
  }
  point(generator.origin)
  point(generator.step)
  if (generator.type === 'text') {
    if (typeof generator.text !== 'string' || generator.text.length > 100000) throw new Error('Invalid text')
    return Array.from(generator.text).length
  }
  if (!Number.isInteger(generator.count) || generator.count < 0 || generator.count > 100000) throw new Error('Invalid linear count')
  if (generator.size) {
    point(generator.size)
    if (generator.size.some(value => value < 0)) throw new Error('Invalid size')
  }
  for (const [key, override] of Object.entries(generator.overrides ?? {})) {
    if (!/^slot-\d+$/.test(key)) throw new Error('Invalid slot override key')
    if (override.offset) point(override.offset)
  }
  return generator.count
}

// Describe only one generated member, deriving its binding and position from the recipe.
function memberAt (part, index, characters = null) {
  const generator = part.generator
  const item = generator.type === 'placements' ? generator.items[index] : generator.type === 'polyline' ? { position: polylinePoint(generator, index) } : null
  const key = item?.key ?? `slot-${index}`
  const override = generator.overrides?.[key] ?? {}
  const position = item?.position ?? generator.origin.map((value, axis) => value + generator.step[axis] * index + (override.offset?.[axis] ?? 0))
  const bindings = (generator.bindingTemplates ?? []).map(template => ({ objectName: template.replaceAll('{index}', String(index)).replaceAll('{key}', key), scope: 'object' }))
  return {
    key, index, position, positionSource: 'generator-recipe', frame: generator.frame ?? 'index',
    ...(generator.type === 'text' ? { character: characters[index] } : {}),
    ...(override.color ? { color: override.color } : {}),
    bindings,
    editMode: part.editMode ?? 'generator',
    ...(bindings.length === 0 ? { geometry: 'logical member; no independently bound geometry' } : {})
  }
}

// Query composition, generator recipes, and bounded selections using plain JSON only.
export function queryIndex (index, request) {
  const validation = validateIndex(index)
  if (request?.op === 'validate-index') return validation
  if (!validation.valid) throw new Error(validation.errors.join('; '))
  if (request?.op === 'inspect-relations') {
    if (request.id && !index.parts.some(part => part.id === request.id)) throw new Error('Unknown semantic part ID')
    return { revision: index.revision, relations: structuredClone((index.relations ?? []).filter(relation => !request.id || relation.from === request.id || relation.to === request.id)), roleRules: structuredClone(index.roleRules ?? {}), note: 'Declared relations are intent; physical and visual verification are separate.' }
  }
  if (request?.op === 'convert-length') return { value: convertLength(request.value, request.from, request.to, index.coordinates), unit: request.to }
  if (request?.op === 'describe-spatial-intent') return spatialIntent(index, request.id)
  const parts = new Map(index.parts.map(part => [part.id, part]))
  const part = parts.get(request?.id ?? request?.selection?.part)
  if (!part) throw new Error('Unknown semantic part ID')
  const children = id => index.parts.filter(candidate => candidate.partOf === id)
  const describe = value => ({ ...structuredClone(value), children: children(value.id).map(child => child.id), ...(value.generator ? { memberCount: memberCount(value.generator) } : {}) })
  switch (request.op) {
    case 'describe-part': return { revision: index.revision, coordinates: coordinateConvention(index.coordinates), part: describe(part) }
    case 'expand-part': {
      const depth = request.depth ?? 1
      if (!Number.isInteger(depth) || depth < 0 || depth > 8) throw new Error('Depth must be 0..8')
      const expand = (value, remaining) => ({ id: value.id, kind: value.kind, ...(value.generator ? { memberCount: memberCount(value.generator) } : {}), ...(remaining > 0 ? { children: children(value.id).map(child => expand(child, remaining - 1)) } : {}) })
      return { revision: index.revision, tree: expand(part, depth) }
    }
    case 'resolve-part': {
      const includeChildren = request.includeChildren ?? true
      if (typeof includeChildren !== 'boolean') throw new Error('includeChildren must be boolean')
      const collect = value => [value, ...(includeChildren ? children(value.id).flatMap(collect) : [])]
      return { revision: index.revision, id: part.id, bindings: collect(part).flatMap(value => (value.bindings ?? []).map(binding => ({ part: value.id, ...structuredClone(binding) }))) }
    }
    case 'select-members': {
      if (part.kind !== 'procedural-set') throw new Error('Part is not a procedural set')
      const selector = request.selector ?? {}
      const limit = request.limit ?? 20
      const offset = request.offset ?? 0
      if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) throw new Error('Expected limit 1..100 and nonnegative offset')
      if (Object.keys(selector).some(key => !['index', 'key', 'range', 'region'].includes(key)) || Object.keys(selector).length > 1) throw new Error('Use one supported selector')
      if (selector.index !== undefined && (!Number.isInteger(selector.index) || selector.index < 0)) throw new Error('Invalid member index')
      if (selector.key !== undefined && typeof selector.key !== 'string') throw new Error('Invalid member key')
      if (selector.range && (!Array.isArray(selector.range) || selector.range.length !== 2 || !selector.range.every(Number.isInteger) || selector.range[0] < 0 || selector.range[1] < selector.range[0])) throw new Error('Invalid half-open range')
      if (selector.region) {
        point(selector.region.min)
        point(selector.region.max)
        if (selector.region.min.some((value, axis) => value > selector.region.max[axis])) throw new Error('Invalid region')
      }
      const count = memberCount(part.generator)
      const characters = part.generator.type === 'text' ? Array.from(part.generator.text) : null
      const members = []
      let total = 0
      for (let i = 0; i < count; i++) {
        if (selector.index !== undefined && i !== selector.index) continue
        if (selector.range && (i < selector.range[0] || i >= selector.range[1])) continue
        const member = memberAt(part, i, characters)
        if (selector.key !== undefined && member.key !== selector.key) continue
        if (selector.region && member.position.some((value, axis) => value < selector.region.min[axis] || value > selector.region.max[axis])) continue
        if (total >= offset && members.length < limit) members.push(member)
        total++
      }
      return { total, offset, limit, selection: { part: part.id, revision: index.revision, keys: members.map(member => member.key) }, members }
    }
    case 'resolve-selection': {
      const selection = request.selection
      if (selection.revision !== index.revision) throw new Error('Stale selection; reselect after regeneration')
      if (part.kind !== 'procedural-set' || !Array.isArray(selection.keys) || selection.keys.length > 100 || selection.keys.some(key => typeof key !== 'string') || new Set(selection.keys).size !== selection.keys.length) throw new Error('Invalid selection')
      const count = memberCount(part.generator)
      const characters = part.generator.type === 'text' ? Array.from(part.generator.text) : null
      const members = []
      for (let i = 0; i < count; i++) {
        const member = memberAt(part, i, characters)
        if (selection.keys.includes(member.key)) members.push(member)
      }
      if (members.length !== selection.keys.length) throw new Error('Selected member no longer exists')
      return { revision: index.revision, members }
    }
    default: throw new Error(`Unknown index operation: ${request.op}`)
  }
}
