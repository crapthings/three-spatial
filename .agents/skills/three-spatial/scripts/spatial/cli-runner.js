#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { ObjectLoader } from 'three'
import { createSpatialTools } from './tools.js'

// Execute the same JSON tool request against a scene file or a running browser bridge.
export async function runSpatialCli (createTools = createSpatialTools, args = process.argv.slice(2)) {
  const [source, input, output] = args
  if (!source || !input) throw new Error('Usage: node <skill>/scripts/spatial/cli.js <scene.json|http://127.0.0.1:5173> <JSON|@request.json> [output.json]')
  const request = JSON.parse(input.startsWith('@') ? await readFile(input.slice(1), 'utf8') : input)
  let result
  if (source.startsWith('http')) {
    const url = new URL('/__spatial', source)
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.protocol !== 'http:') throw new Error('Bridge requires a local HTTP URL')
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(12000) })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`)
    result = payload.result
  } else {
    const root = new ObjectLoader().parse(JSON.parse(await readFile(source, 'utf8')))
    const tools = createTools(root)
    result = tools(request)
    if (['apply-transform', 'update-procedural', 'orient-toward', 'align-axis'].includes(request.op)) {
      if (!output) throw new Error('Offline edits require an explicit output scene filename')
      await writeFile(output, JSON.stringify(tools({ op: 'export-scene' }), null, 2))
      console.log(JSON.stringify(result, null, 2))
      return
    }
  }
  if (output) await writeFile(output, JSON.stringify(result, null, 2))
  else console.log(JSON.stringify(result, null, 2))
}


