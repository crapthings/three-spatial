import { Box3, Matrix4, Raycaster, Vector3 } from 'three'
import { createIndexAdapter } from '../spatial-index/three-adapter.js'
import { createOrientationTools } from './orientation.js'
import { convertLength } from '../spatial-index/contracts.js'
import { sceneCoordinates, measureDimensions } from './measurement.js'

// Reject malformed numeric vectors before they can corrupt a scene transform.
function vector (value, size = 3) {
  if (!Array.isArray(value) || value.length !== size || !value.every(Number.isFinite)) throw new Error(`Expected ${size} finite numbers`)
  return value
}

// Provide engine-backed geometry operations over any registered Object3D subtree.
export function createSpatialTools (root, { updateProcedural } = {}) {
  const find = id => {
    if (id === 'world') throw new Error('world is a coordinate frame, not an object')
    const matches = []
    root.traverse(object => { if (object.uuid === id || object.name === id) matches.push(object) })
    if (matches.length !== 1) throw new Error(`Expected one object for ${id}; found ${matches.length}`)
    return matches[0]
  }
  const whole = id => {
    const part = root.userData.spatialIndex?.parts.find(part => part.id === id)
    if (!part) return find(id)
    if (id === root.name && part.bindings?.length === 0) return root
    if (part.bindings?.length !== 1 || part.bindings[0].scope !== 'object') throw new Error('Choose one whole-object binding for a dimension query')
    return find(part.bindings[0].objectName)
  }
  const matrix = id => id === 'world' ? new Matrix4() : find(id).matrixWorld
  const bounds = object => {
    const box = new Box3().setFromObject(object, true)
    if (box.isEmpty()) throw new Error(`Object has no geometry: ${object.name || object.uuid}`)
    return box
  }
  const describe = object => {
    const box = new Box3().setFromObject(object, true)
    return {
      id: object.uuid, name: object.name, type: object.type,
      parent: object === root ? null : object.parent?.uuid ?? null,
      position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray(),
      worldPosition: object.getWorldPosition(new Vector3()).toArray(), worldMatrix: object.matrixWorld.toArray(),
      coordinates: sceneCoordinates(root),
      bounds: box.isEmpty() ? null : { min: box.min.toArray(), max: box.max.toArray() }
    }
  }
  return function execute (request) {
    if (!request || typeof request.op !== 'string') throw new Error('Expected a request with op')
    const coordinates = sceneCoordinates(root)
    if (['inspect-orientation', 'measure-angle', 'orient-toward', 'align-axis'].includes(request.op)) return createOrientationTools(root, find)(request)
    if (['inspect-relations', 'check-relations', 'describe-spatial-intent', 'describe-part', 'expand-part', 'resolve-part', 'select-members', 'resolve-selection', 'validate-index', 'export-index', 'update-procedural'].includes(request.op)) return createIndexAdapter(root, { updateProcedural })(request)
    root.updateWorldMatrix(true, true)
    switch (request.op) {
      case 'describe-scene': return { coordinates, style: root.userData.spatialIndex?.style ?? {}, defaultPhysicalScale: coordinates.metersPerUnit === null ? 'unknown' : 'declared' }
      case 'convert-length': return { value: convertLength(request.value, request.from, request.to, coordinates), unit: request.to, coordinates }
      case 'inspect-dimensions': {
        const object = whole(request.id)
        return { id: object.uuid, name: object.name, coordinates, ...measureDimensions(object, coordinates) }
      }
      case 'list': {
        const objects = []
        root.traverse(object => objects.push({ id: object.uuid, name: object.name, type: object.type }))
        return { units: 'scene-unit', coordinates, axes: `${coordinates.handedness}-handed, ${coordinates.up}-up`, objects }
      }
      case 'inspect-object': return describe(find(request.id))
      case 'transform-point': {
        const target = matrix(request.to ?? 'world')
        if (Math.abs(target.determinant()) < 1e-12) throw new Error('Target frame has a singular transform')
        return { point: new Vector3(...vector(request.point)).applyMatrix4(matrix(request.from ?? 'world')).applyMatrix4(target.clone().invert()).toArray(), frame: request.to ?? 'world', unit: !request.to || request.to === 'world' ? 'scene-unit' : 'frame-local-unit', coordinates }
      }
      case 'measure-distance': {
        const a = find(request.a)
        const b = find(request.b)
        if (request.mode === 'aabb') {
          const first = bounds(a)
          const second = bounds(b)
          const gaps = ['x', 'y', 'z'].map(axis => Math.max(0, first.min[axis] - second.max[axis], second.min[axis] - first.max[axis]))
          return { distance: convertLength(Math.hypot(...gaps), 'scene-unit', request.unit ?? 'scene-unit', coordinates), units: request.unit ?? 'scene-unit', coordinates, method: 'world-aabb-lower-bound' }
        }
        if (request.mode && request.mode !== 'origin') throw new Error('mode must be origin or aabb')
        return { distance: convertLength(a.getWorldPosition(new Vector3()).distanceTo(b.getWorldPosition(new Vector3())), 'scene-unit', request.unit ?? 'scene-unit', coordinates), units: request.unit ?? 'scene-unit', coordinates, method: 'world-origins' }
      }
      case 'check-overlap': {
        const a = bounds(find(request.a))
        const b = bounds(find(request.b))
        return { overlaps: a.intersectsBox(b), method: 'world-aabb', includesTouching: true }
      }
      case 'raycast': {
        const direction = new Vector3(...vector(request.direction))
        if (direction.lengthSq() === 0) throw new Error('Ray direction must be nonzero')
        const ray = new Raycaster(new Vector3(...vector(request.origin)), direction.normalize())
        const hits = ray.intersectObject(root, true)
        return { unit: 'scene-unit', coordinates, method: 'three-mesh-raycast-material-side', hits: hits.slice(0, 100).map(hit => ({ id: hit.object.uuid, name: hit.object.name, point: hit.point.toArray(), distance: hit.distance })) }
      }
      case 'apply-transform': {
        const object = find(request.id)
        if (!object.matrixAutoUpdate) throw new Error('Manual matrix objects cannot be edited with TRS tools')
        if (!['position', 'quaternion', 'scale'].some(key => request[key] !== undefined)) throw new Error('No transform fields supplied')
        if (request.position !== undefined) vector(request.position)
        if (request.scale !== undefined) {
          vector(request.scale)
          if (request.scale.some(value => Math.abs(value) < 1e-8)) throw new Error('Scale must be nonzero')
        }
        if (request.quaternion !== undefined) {
          vector(request.quaternion, 4)
          if (Math.abs(Math.hypot(...request.quaternion) - 1) > 1e-6) throw new Error('Quaternion must be normalized')
        }
        if (request.position) object.position.fromArray(request.position)
        if (request.quaternion) object.quaternion.fromArray(request.quaternion)
        if (request.scale) object.scale.fromArray(request.scale)
        root.updateWorldMatrix(true, true)
        return describe(object)
      }
      case 'check-constraints': {
        if (!Array.isArray(request.constraints) || request.constraints.length < 1 || request.constraints.length > 100) throw new Error('Expected 1..100 constraints')
        const results = request.constraints.map(constraint => {
          const tolerance = constraint.tolerance ?? (['face-target', 'upright'].includes(constraint.type) ? 0.01 : 0.001)
          if (!Number.isFinite(tolerance) || tolerance <= 0) throw new Error('Tolerance must be positive and finite')
          let error
          let unit = 'scene-unit'
          const angular = ['face-target', 'upright'].includes(constraint.type)
          if (angular && constraint.unit !== undefined && constraint.unit !== 'radians') throw new Error('Angular tolerances use radians')
          const inputLength = value => convertLength(value, constraint.unit ?? 'scene-unit', 'scene-unit', coordinates)
          switch (constraint.type) {
            case 'world-position':
              error = find(constraint.id).getWorldPosition(new Vector3()).distanceTo(new Vector3(...inputLength(vector(constraint.target))))
              break
            case 'origin-distance':
              if (!Number.isFinite(constraint.distance) || constraint.distance < 0) throw new Error('Distance must be nonnegative and finite')
              error = Math.abs(execute({ op: 'measure-distance', a: constraint.a, b: constraint.b }).distance - inputLength(constraint.distance))
              break
            case 'world-aabb-size': {
              const size = execute({ op: 'inspect-dimensions', id: constraint.id }).worldAabb.size
              const target = inputLength(vector(constraint.target))
              if (target.some(value => value <= 0)) throw new Error('Target sizes must be positive')
              error = Math.max(...size.map((value, axis) => Math.abs(value - target[axis])))
              break
            }
            case 'face-target': {
              const orientation = execute({ op: 'inspect-orientation', id: constraint.id })
              const direction = new Vector3(...vector(constraint.target)).sub(new Vector3(...orientation.world.position))
              error = execute({ op: 'measure-angle', a: { id: constraint.id, axis: constraint.axis ?? 'front' }, b: { direction: direction.toArray() } }).radians
              unit = 'radians'
              break
            }
            case 'upright':
              error = execute({ op: 'measure-angle', a: { id: constraint.id, axis: 'up' }, b: { direction: constraint.up ?? [0, 1, 0] } }).radians
              unit = 'radians'
              break
            case 'aabb-no-overlap':
              return { type: constraint.type, pass: !execute({ op: 'check-overlap', a: constraint.a, b: constraint.b }).overlaps, method: 'world-aabb' }
            default: throw new Error(`Unknown constraint: ${constraint.type}`)
          }
          if (!angular) {
            unit = constraint.unit ?? 'scene-unit'
            error = convertLength(error, 'scene-unit', unit, coordinates)
          }
          return { type: constraint.type, pass: Number.isFinite(error) && error <= tolerance, error, tolerance, unit }
        })
        return { pass: results.every(result => result.pass), results }
      }
      case 'export-scene': return root.toJSON()
      default: throw new Error(`Unknown spatial operation: ${request.op}`)
    }
  }
}
