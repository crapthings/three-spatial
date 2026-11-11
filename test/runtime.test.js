import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createSpatialTools } from '../.agents/skills/three-spatial/scripts/spatial/tools.js'

// Resolve the exact locked Three.js installation without adding a second package manifest.
const runtime = createRequire(new URL('../.agents/skills/three-spatial/scripts/package.json', import.meta.url)).resolve('three')
// Import the ESM build from that installation, matching the bundled tools.
const { ObjectLoader, Float32BufferAttribute } = await import(pathToFileURL(join(dirname(runtime), 'three.module.js')))
// Locate bundled tools independently of the test working directory.
const scripts = fileURLToPath(new URL('../.agents/skills/three-spatial/scripts/', import.meta.url))

// Generate isolated scene fixtures and clean them even when an assertion fails.
function fixture (callback) {
  const folder = mkdtempSync(join(tmpdir(), 'three-spatial-test-'))
  const run = (script, args) => spawnSync(process.execPath, [join(scripts, script), ...args], { cwd: folder, encoding: 'utf8' })
  try {
    assert.equal(run('create-example.js', [folder]).status, 0)
    const scene = join(folder, 'example-scene.json')
    const cli = (request, output) => run('spatial/cli.js', [scene, JSON.stringify(request), ...(output ? [output] : [])])
    callback({ folder, scene, cli, run })
  } finally { rmSync(folder, { recursive: true, force: true }) }
}

// Assert actual physical dimensions and persisted edits, not just successful command execution.
test('offline geometry queries and edits preserve measurable results', () => fixture(({ folder, cli, run }) => {
  const dimensions = JSON.parse(cli({ op: 'inspect-dimensions', id: 'example.block' }).stdout)
  dimensions.worldAabb.sizeMeters.forEach((value, i) => assert.ok(Math.abs(value - [1, 0.8, 1.2][i]) < 1e-6))
  const output = join(folder, 'edited.json')
  assert.equal(cli({ op: 'apply-transform', id: 'block', position: [2, 0.4, 1] }, output).status, 0)
  const inspected = run('spatial/cli.js', [output, '{"op":"inspect-object","id":"block"}'])
  assert.deepEqual(JSON.parse(inspected.stdout).worldPosition, [2, 0.4, 1])
  assert.equal(cli({ op: 'apply-transform', id: 'block', position: [0, 0, 0] }).status, 1)
}))

// Ensure failed checks stop automation while ordinary negative query findings remain successful queries.
test('constraint checks expose pass and fail through exit codes and reports', () => fixture(({ folder, cli }) => {
  const check = target => ({ op: 'check-constraints', constraints: [{ type: 'world-position', id: 'block', target }] })
  assert.equal(cli(check([1, 0.4, 0.6])).status, 0)
  const output = join(folder, 'failed-report.json')
  assert.equal(cli(check([100, 0, 0]), output).status, 1)
  assert.equal(JSON.parse(readFileSync(output)).pass, false)
  assert.equal(cli({ op: 'check-overlap', a: 'block', b: 'platform' }).status, 0)
}))

// Keep geometry and engine-free index validation consistent for malformed semantic graphs.
test('both index CLIs reject invalid intent with a readable report', () => fixture(({ scene, folder, cli, run }) => {
  const serialized = JSON.parse(readFileSync(scene))
  serialized.object.userData.spatialIndex.parts.push({ id: 'orphan', kind: 'component', partOf: 'missing' })
  writeFileSync(scene, JSON.stringify(serialized))
  const indexFile = join(folder, 'invalid-index.json')
  writeFileSync(indexFile, JSON.stringify(serialized.object.userData.spatialIndex))
  for (const result of [cli({ op: 'validate-index' }), run('spatial-index/cli.js', [indexFile, '{"op":"validate-index"}'])]) {
    assert.equal(result.status, 1)
    assert.equal(JSON.parse(result.stdout).valid, false)
  }
}))

// Distinguish verified contact, measured separation, and missing evidence in real CLI invocations.
test('relation checks distinguish pass, failure, and needs-review', () => fixture(({ scene, cli }) => {
  assert.equal(cli({ op: 'check-relations' }).status, 0)
  const serialized = JSON.parse(readFileSync(scene))
  const block = serialized.object.children.find(object => object.name === 'block')
  block.matrix[13] += 2
  writeFileSync(scene, JSON.stringify(serialized))
  assert.equal(cli({ op: 'check-relations' }).status, 1)
  serialized.object.userData.spatialIndex.relations = []
  writeFileSync(scene, JSON.stringify(serialized))
  const missing = cli({ op: 'check-relations' })
  assert.equal(missing.status, 2)
  assert.equal(JSON.parse(missing.stdout).status, 'needs-review')
}))

// Reject undeformed contact evidence when an active morph has lifted the visible geometry.
test('active morph targets cannot pass a static support check', () => fixture(({ scene }) => {
  const root = new ObjectLoader().parse(JSON.parse(readFileSync(scene)))
  const block = root.getObjectByName('block')
  const positions = block.geometry.attributes.position.array
  block.geometry.morphAttributes.position = [new Float32BufferAttribute(Array.from(positions, (value, i) => value + (i % 3 === 1 ? 10 : 0)), 3)]
  block.updateMorphTargets()
  const execute = createSpatialTools(root)
  block.morphTargetInfluences[0] = 0
  assert.equal(execute({ op: 'check-relations' }).status, 'pass')
  block.morphTargetInfluences[0] = 1
  const result = execute({ op: 'check-relations' })
  assert.equal(result.status, 'needs-review')
  assert.equal(result.pass, false)
  assert.match(result.results[0].reason, /morph/)
}))
