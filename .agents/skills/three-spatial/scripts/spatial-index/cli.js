import { readFile, writeFile } from 'node:fs/promises'
import { queryIndex } from './core.js'

// Run semantic queries without importing Three.js, loading geometry, or starting a browser.
async function main () {
  const [source, input, output] = process.argv.slice(2)
  if (!source || !input) throw new Error('Usage: node <skill>/scripts/spatial-index/cli.js index.json <JSON|@request.json> [output.json]')
  const index = JSON.parse(await readFile(source, 'utf8'))
  const request = JSON.parse(input.startsWith('@') ? await readFile(input.slice(1), 'utf8') : input)
  const result = queryIndex(index, request)
  const text = JSON.stringify(result, null, 2) + '\n'
  if (output) await writeFile(output, text)
  else console.log(text.trimEnd())
  if (request.op === 'validate-index' && !result.valid) process.exitCode = 1
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
