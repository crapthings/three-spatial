import { Box3, Matrix4, Vector3 } from 'three'
import { coordinateConvention, convertLength } from '../spatial-index/contracts.js'

// Resolve the registered scene's unit mapping without silently applying the one-meter example to unknown scenes.
export function sceneCoordinates (root) {
  return coordinateConvention(root.userData.spatialIndex?.coordinates ?? root.userData.coordinates ?? (root.userData.units === 'meters' ? { unit: 'meter' } : {}))
}

// Measure static descendant geometry in object-local coordinates and actual world axes without resizing it.
export function measureDimensions (object, coordinates) {
  if (Math.abs(object.matrixWorld.determinant()) < 1e-12) throw new Error('Cannot measure local dimensions of a singular transform')
  const inverse = object.matrixWorld.clone().invert()
  const local = new Box3()
  const world = new Box3()
  const vertex = new Vector3()
  const relative = new Matrix4()
  object.traverse(child => {
    if (!child.geometry) return
    if (child.isInstancedMesh || child.isSkinnedMesh || child.morphTargetInfluences?.some(value => value !== 0)) throw new Error('Dimension query supports static, non-instanced geometry only')
    const positions = child.geometry.attributes.position
    if (!positions) return
    relative.multiplyMatrices(inverse, child.matrixWorld)
    for (let index = 0; index < positions.count; index++) {
      vertex.fromBufferAttribute(positions, index)
      if (![vertex.x, vertex.y, vertex.z].every(Number.isFinite)) throw new Error('Nonfinite geometry')
      local.expandByPoint(vertex.clone().applyMatrix4(relative))
      world.expandByPoint(vertex.applyMatrix4(child.matrixWorld))
    }
  })
  if (world.isEmpty()) throw new Error('Object has no measurable static geometry')
  const size = world.getSize(new Vector3()).toArray()
  return {
    localGeometry: { size: local.getSize(new Vector3()).toArray(), min: local.min.toArray(), max: local.max.toArray(), unit: 'object-local-unit', excludesObjectAndAncestorTransforms: true },
    worldAabb: { size, min: world.min.toArray(), max: world.max.toArray(), unit: 'scene-unit', sizeMeters: coordinates.metersPerUnit === null ? null : convertLength(size, 'scene-unit', 'meter', coordinates), method: 'static-vertex-world-aabb' },
    axes: ['X', 'Y', 'Z'], objectScale: object.scale.toArray(), scaleUnit: 'dimensionless'
  }
}
