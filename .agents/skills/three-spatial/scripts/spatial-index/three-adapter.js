import { Box3, Triangle, Vector3 } from 'three'
import { queryIndex, validateIndex } from './core.js'

// Resolve semantic bindings against the current engine state while retaining approximation provenance.
export function createIndexAdapter (root, { updateProcedural } = {}) {
  const find = name => {
    const matches = []
    root.traverse(object => { if (object.name === name) matches.push(object) })
    if (matches.length !== 1) throw new Error(`Binding ${name}: expected one object, found ${matches.length}`)
    return matches[0]
  }
  const endpoint = id => {
    const part = root.userData.spatialIndex.parts.find(part => part.id === id)
    if (!part || part.bindings?.length !== 1 || part.bindings[0].scope !== 'object') throw new Error('Relation geometry requires one whole-object binding per endpoint')
    return find(part.bindings[0].objectName)
  }
  const surfaceDistance = (object, point) => {
    let distance = Infinity
    const triangle = new Triangle()
    const closest = new Vector3()
    object.traverse(child => {
      if (!child.geometry) return
      if (child.isSkinnedMesh || child.isInstancedMesh) throw new Error('Relation contact checks support static meshes only')
      const positions = child.geometry.attributes.position
      const indices = child.geometry.index
      for (let i = 0; i < (indices?.count ?? positions.count); i += 3) {
        for (const [offset, vertex] of [triangle.a, triangle.b, triangle.c].entries()) vertex.fromBufferAttribute(positions, indices ? indices.getX(i + offset) : i + offset).applyMatrix4(child.matrixWorld)
        triangle.closestPointToPoint(point, closest)
        distance = Math.min(distance, closest.distanceTo(point))
      }
    })
    return distance
  }
  const resolve = binding => {
    const object = find(binding.objectName)
    const box = binding.scope === 'shared-geometry' && binding.region
      ? new Box3(new Vector3(...binding.region.min), new Vector3(...binding.region.max)).applyMatrix4(root.matrixWorld)
      : new Box3().setFromObject(object, true)
    return {
      ...binding,
      runtimeId: object.uuid,
      worldPosition: object.getWorldPosition(new Vector3()).toArray(),
      bounds: box.isEmpty() ? null : { min: box.min.toArray(), max: box.max.toArray() },
      method: binding.scope === 'shared-geometry' ? 'declared-region-world-aabb; not extracted mesh faces' : 'engine-world-aabb'
    }
  }
  return request => {
    const index = root.userData.spatialIndex
    if (!index) throw new Error('This scene has no semantic index')
    root.updateWorldMatrix(true, true)
    if (request.op === 'export-index') return structuredClone(index)
    if (request.op === 'update-procedural') {
      if (!updateProcedural) throw new Error('No procedural edit adapter registered for this scene')
      return updateProcedural(root, request)
    }
    if (request.op === 'check-relations') {
      const validation = validateIndex(index)
      if (!validation.valid) return { pass: false, intentErrors: validation.errors, results: [] }
      const results = (index.relations ?? []).map(relation => {
        if (!relation.anchors) return { id: relation.id, status: 'unverified', reason: 'Qualitative relation needs a scene-specific check or visual review' }
        try {
          const a = endpoint(relation.from)
          const b = endpoint(relation.to)
          const first = a.localToWorld(new Vector3(...relation.anchors.from))
          const second = b.localToWorld(new Vector3(...relation.anchors.to))
          const anchorError = first.distanceTo(second)
          const sourceSurfaceError = surfaceDistance(a, first)
          const targetSurfaceError = surfaceDistance(b, second)
          const pass = Math.max(anchorError, sourceSurfaceError, targetSurfaceError) <= relation.tolerance
          return { id: relation.id, status: pass ? 'pass' : 'fail', anchorError, sourceSurfaceError: Number.isFinite(sourceSurfaceError) ? sourceSurfaceError : null, targetSurfaceError: Number.isFinite(targetSurfaceError) ? targetSurfaceError : null, unit: 'scene-unit', method: 'anchor coincidence and static triangle surface distance' }
        } catch (error) { return { id: relation.id, status: 'unverified', reason: error.message } }
      })
      return { status: results.some(result => result.status === 'fail') ? 'fail' : results.some(result => result.status === 'unverified') || results.length === 0 ? 'needs-review' : 'pass', pass: results.length > 0 && results.every(result => result.status === 'pass'), results, note: 'Unverified is not passed; contact does not prove structural load capacity or visual completeness.' }
    }
    if (request.op === 'validate-index') {
      const result = validateIndex(index)
      const bindingErrors = []
      if (result.valid) {
        for (const part of index.parts) {
          for (const binding of part.bindings ?? []) {
            try { find(binding.objectName) } catch (error) { bindingErrors.push(error.message) }
          }
        }
      }
      return { ...result, valid: result.valid && bindingErrors.length === 0, bindingErrors, coverage: 'semantic graph and explicit collection/component bindings; generated member bindings resolved on demand' }
    }
    const result = queryIndex(index, request)
    if (request.op === 'resolve-part') return { ...result, bindings: result.bindings.map(resolve) }
    if (request.op === 'resolve-selection') return { ...result, members: result.members.map(member => ({ ...member, bindings: member.bindings.map(resolve) })) }
    return result
  }
}
