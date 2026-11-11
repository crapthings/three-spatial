import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'three'

// Generate a portable geometry/index fixture without depending on any host application's scene generators.
const root = new Group()
root.name = 'example'
// Provide a visible block whose origin is at its center and bottom rests on the support platform.
const block = new Mesh(new BoxGeometry(1, 0.8, 1.2), new MeshBasicMaterial({ color: '#a3e635' }))
block.name = 'block'
block.position.set(1, 0.4, 0.6)
// Keep the supporting object distinct so contact and overlap queries have concrete geometry.
const platform = new Mesh(new BoxGeometry(4, 0.2, 4), new MeshBasicMaterial({ color: '#475569' }))
platform.name = 'platform'
platform.position.y = -0.1
root.add(platform, block)
root.userData.spatialIndex = {
  schemaVersion: 1, revision: 0,
  coordinates: { unit: 'scene-unit', metersPerUnit: 1, dimensions: 3, handedness: 'right', up: '+Y', frame: 'example-root' },
  style: { geometry: 'lowpoly', proportions: 'realistic', preserve: ['support contact'] },
  parts: [
    { id: 'example', kind: 'assembly', bindings: [] },
    { id: 'example.block', kind: 'component', partOf: 'example', role: 'prop', bindings: [{ objectName: 'block', scope: 'object' }], orientation: { front: [0, 0, 1], up: [0, 1, 0] } },
    { id: 'example.platform', kind: 'component', partOf: 'example', role: 'support', bindings: [{ objectName: 'platform', scope: 'object' }] }
  ],
  relations: [{ id: 'platform-support', type: 'supports', from: 'example.platform', to: 'example.block', anchors: { from: [1, 0.1, 0.6], to: [0, -0.4, 0] }, tolerance: 0.001 }]
}
root.updateMatrixWorld(true)
// Write outputs only to the caller's explicitly selected project directory or its artifacts folder.
const output = process.argv[2] ?? 'artifacts'
await mkdir(output, { recursive: true })
await writeFile(join(output, 'example-scene.json'), JSON.stringify(root.toJSON(), null, 2) + '\n')
await writeFile(join(output, 'example-index.json'), JSON.stringify(root.userData.spatialIndex, null, 2) + '\n')
console.log(`Created ${join(output, 'example-scene.json')}`)
