// Validate author-declared roles and relation contracts without assuming a fixed catalog of architectural styles.
export function validateRelations (index) {
  const errors = []
  const parts = new Map(index.parts.map(part => [part.id, part]))
  const relations = index.relations ?? []
  if (!Array.isArray(relations)) return ['relations must be an array']
  const ids = new Set()
  for (const relation of relations) {
    if (!relation || typeof relation.id !== 'string' || !relation.id || ids.has(relation.id)) { errors.push('Invalid or duplicate relation ID'); continue }
    ids.add(relation.id)
    if (!parts.has(relation.from) || !parts.has(relation.to)) errors.push(`Missing relation endpoint: ${relation.id}`)
    if (!['attached-to', 'supports', 'connects', 'defines-boundary'].includes(relation.type)) errors.push(`Unknown relation type: ${relation.id}`)
    if (relation.anchors) {
      for (const key of ['from', 'to']) if (!Array.isArray(relation.anchors[key]) || relation.anchors[key].length !== 3 || !relation.anchors[key].every(Number.isFinite)) errors.push(`Invalid anchor: ${relation.id}`)
      if (!Number.isFinite(relation.tolerance) || relation.tolerance <= 0) errors.push(`Invalid anchor tolerance: ${relation.id}`)
    }
  }
  for (const part of index.parts) {
    if (part.role !== undefined && (typeof part.role !== 'string' || !part.role)) errors.push(`Invalid role: ${part.id}`)
    const rules = index.roleRules?.[part.role]?.requiresOutgoing ?? []
    if (!Array.isArray(rules)) { errors.push(`Invalid role rule: ${part.role}`); continue }
    for (const type of rules) if (!relations.some(relation => relation.from === part.id && relation.type === type)) errors.push(`${part.id} (${part.role}) requires outgoing ${type}`)
    if (part.requiresRoles !== undefined && !Array.isArray(part.requiresRoles)) { errors.push(`Invalid role requirements: ${part.id}`); continue }
    for (const requirement of part.requiresRoles ?? []) {
      if (!requirement || typeof requirement.role !== 'string' || !Number.isInteger(requirement.min) || requirement.min < 1) { errors.push(`Invalid required role: ${part.id}`); continue }
      const children = index.parts.filter(child => child.partOf === part.id && child.role === requirement.role)
      if (children.length < requirement.min) errors.push(`${part.id} requires ${requirement.min} direct child role ${requirement.role}; found ${children.length}`)
    }
  }
  return errors
}
