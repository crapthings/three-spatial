import { Matrix4, Quaternion, Vector3 } from 'three'
import { sceneCoordinates } from './measurement.js'
import { directionAngle, orientationBasis, unitDirection } from '../spatial-index/directions.js'

// Query and modify orientation using semantic axes, explicit reference frames, and verified quaternion results.
export function createOrientationTools (root, find) {
  const objectFor = id => {
    const part = root.userData.spatialIndex?.parts.find(part => part.id === id)
    if (!part) return find(id)
    if (part.id === root.name && part.bindings?.length === 0) return root
    if (part.bindings?.length !== 1 || part.bindings[0].scope !== 'object') throw new Error('Orientation requires one whole-object binding; choose a concrete component')
    return find(part.bindings[0].objectName)
  }
  const semantics = (object, request = {}) => {
    const declared = root.userData.spatialIndex?.parts.filter(part => part.orientation && part.bindings?.some(binding => binding.objectName === object.name && binding.scope === 'object')) ?? []
    if (!object.userData.orientation && declared.length > 1) throw new Error('Ambiguous semantic orientation declaration')
    const basis = object.userData.orientation ?? declared[0]?.orientation ?? { front: object.isCamera ? [0, 0, -1] : [0, 0, 1], up: [0, 1, 0] }
    return { ...orientationBasis({ front: request.front ?? basis.front, up: request.up ?? basis.up }), source: request.front || request.up ? 'request' : object.userData.orientation ? 'object-metadata' : declared.length ? 'semantic-index' : 'engine-default-assumption' }
  }
  const axisFor = (object, axis, basis) => new Vector3(...unitDirection(typeof axis === 'string' ? basis[axis] : axis)).transformDirection(object.matrixWorld)
  const direction = value => {
    if (!value || typeof value !== 'object') throw new Error('Expected a direction descriptor')
    if (value.id !== undefined) {
      const object = objectFor(value.id)
      return axisFor(object, value.axis ?? 'front', semantics(object))
    }
    const vector = new Vector3(...unitDirection(value.direction))
    if (value.frame && value.frame !== 'world') vector.transformDirection(objectFor(value.frame).matrixWorld)
    return vector
  }
  const inspect = (object, request) => {
    const basis = semantics(object, request)
    return {
      id: object.uuid, name: object.name, source: basis.source, coordinates: sceneCoordinates(root),
      local: { front: basis.front, up: basis.up, quaternion: object.quaternion.toArray() },
      world: { position: object.getWorldPosition(new Vector3()).toArray(), front: axisFor(object, 'front', basis).toArray(), up: axisFor(object, 'up', basis).toArray() },
      conventions: 'right-handed, Y-up; angles in radians and degrees; quaternion [x,y,z,w]'
    }
  }
  const editable = object => {
    for (let current = object; current; current = current.parent) {
      if (!current.matrixAutoUpdate || !current.matrixWorldAutoUpdate) throw new Error('Orientation edits require automatic TRS matrices')
      const { x, y, z } = current.scale
      if (Math.min(x, y, z) <= 1e-8 || Math.max(x, y, z) - Math.min(x, y, z) > 1e-8 * Math.max(x, y, z)) throw new Error('Orientation edits require positive uniform scale throughout the ancestor chain')
    }
  }
  return request => {
    const coordinates = sceneCoordinates(root)
    if (coordinates.handedness !== 'right' || coordinates.up !== '+Y') throw new Error('This orientation adapter currently requires right-handed, Y-up coordinates')
    root.updateWorldMatrix(true, true)
    if (request.op === 'measure-angle') {
      const a = direction(request.a)
      const b = direction(request.b)
      if (request.about === undefined) return { ...directionAngle(a.toArray(), b.toArray()), method: 'unsigned-world-directions' }
      const normal = new Vector3(...unitDirection(request.about))
      a.projectOnPlane(normal)
      b.projectOnPlane(normal)
      if (a.lengthSq() < 1e-12 || b.lengthSq() < 1e-12) throw new Error('Direction has no heading in the requested plane')
      a.normalize()
      b.normalize()
      const radians = Math.atan2(normal.dot(a.clone().cross(b)), a.dot(b))
      return { radians, degrees: radians * 180 / Math.PI, method: 'signed-projected-world-directions', about: normal.toArray() }
    }
    const object = objectFor(request.id)
    if (request.op === 'inspect-orientation') return inspect(object, request)
    if (!['orient-toward', 'align-axis'].includes(request.op)) throw new Error('Unknown orientation operation')
    editable(object)
    const basis = semantics(object, request)
    const origin = object.getWorldPosition(new Vector3())
    let desired
    if (request.op === 'orient-toward') {
      if (!Array.isArray(request.target) || request.target.length !== 3 || !request.target.every(Number.isFinite)) throw new Error('Expected a finite target point')
      desired = new Vector3(...request.target)
      if (request.frame && request.frame !== 'world') desired.applyMatrix4(objectFor(request.frame).matrixWorld)
      desired.sub(origin)
    } else desired = direction({ direction: request.direction, frame: request.frame })
    if (desired.lengthSq() < 1e-12) throw new Error('Target coincides with the object origin')
    desired.normalize()
    const axis = request.op === 'orient-toward' ? 'front' : request.axis ?? 'front'
    const current = axisFor(object, axis, basis)
    const worldUp = new Vector3(...unitDirection(request.worldUp ?? [0, 1, 0]))
    const mode = request.mode ?? (request.op === 'orient-toward' ? 'yaw' : 'free')
    let worldQuaternion
    if (mode === 'yaw') {
      if (axisFor(object, 'up', basis).dot(worldUp) < 1 - 1e-6) throw new Error('Yaw mode requires an upright object; align up first or use free mode')
      current.projectOnPlane(worldUp)
      desired.projectOnPlane(worldUp)
      if (current.lengthSq() < 1e-12 || desired.lengthSq() < 1e-12) throw new Error('Direction has no heading in the yaw plane')
      current.normalize()
      desired.normalize()
      const radians = Math.atan2(worldUp.dot(current.clone().cross(desired)), current.dot(desired))
      worldQuaternion = new Quaternion().setFromAxisAngle(worldUp, radians).multiply(object.getWorldQuaternion(new Quaternion()))
    } else if (mode === 'free' && request.op === 'align-axis') {
      worldQuaternion = new Quaternion().setFromUnitVectors(current, desired).multiply(object.getWorldQuaternion(new Quaternion()))
    } else if (mode === 'free') {
      const up = worldUp.clone().projectOnPlane(desired)
      if (up.lengthSq() < 1e-12) throw new Error('Target direction is parallel to worldUp; choose another up direction')
      up.normalize()
      const localFront = new Vector3(...basis.front)
      const localUp = new Vector3(...basis.up)
      const localBasis = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(localUp.clone().cross(localFront), localUp, localFront))
      const targetBasis = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(up.clone().cross(desired), up, desired))
      worldQuaternion = targetBasis.multiply(localBasis.invert())
    } else throw new Error('mode must be yaw or free')
    const original = object.quaternion.clone()
    try {
      const parentQuaternion = object.parent ? object.parent.getWorldQuaternion(new Quaternion()) : new Quaternion()
      object.quaternion.copy(parentQuaternion.invert().multiply(worldQuaternion).normalize())
      root.updateWorldMatrix(true, true)
      const actual = axisFor(object, axis, basis)
      if (mode === 'yaw') actual.projectOnPlane(worldUp).normalize()
      const error = directionAngle(actual.toArray(), desired.toArray())
      const positionDrift = object.getWorldPosition(new Vector3()).distanceTo(origin)
      if (error.radians > 1e-6 || positionDrift > 1e-8) throw new Error('Orientation verification failed')
      return { ...inspect(object, request), mode, angularError: error, positionDrift, positionDriftUnit: 'scene-unit', verified: true }
    } catch (error) {
      object.quaternion.copy(original)
      root.updateWorldMatrix(true, true)
      throw error
    }
  }
}
