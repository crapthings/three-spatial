import assert from 'node:assert/strict'
import { lstat, readFile, readdir } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve the publishable skill independently of the caller's current working directory.
const repository = fileURLToPath(new URL('../', import.meta.url))
// Restrict bundled dependencies to files that survive an independent skill installation.
const skill = join(repository, '.agents/skills/three-spatial')

// Check a local reference and, for Markdown, verify its heading anchor as well.
async function checkLink (source, link, boundary) {
  if (/^[a-z][a-z\d+.-]*:/i.test(link)) return
  const [path, anchor] = link.split('#')
  const target = path ? resolve(dirname(source), path) : source
  const offset = relative(boundary, target)
  assert.ok(offset !== '..' && !offset.startsWith('../'), `Outside package: ${source}: ${link}`)
  assert.ok((await lstat(target)).isFile(), `Missing file: ${source}: ${link}`)
  if (anchor && target.endsWith('.md')) {
    const text = await readFile(target, 'utf8')
    const slugs = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => match[1].toLowerCase().replace(/[^\w -]/g, '').replaceAll(' ', '-'))
    assert.ok(slugs.includes(anchor), `Missing heading: ${source}: ${link}`)
  }
}

// Validate every shipped source import and document link without reading installed dependencies.
async function inspect (directory) {
  let files = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.DS_Store', '__pycache__'].includes(entry.name)) continue
    const path = join(directory, entry.name)
    assert.ok(!(await lstat(path)).isSymbolicLink(), `Unexpected symlink: ${path}`)
    if (entry.isDirectory()) { files += await inspect(path); continue }
    files++
    const text = await readFile(path, 'utf8')
    const links = path.endsWith('.md')
      ? [...text.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1])
      : path.endsWith('.js') ? [...text.matchAll(/(?:from\s+|import\s*(?:\(\s*)?)['"](\.[^'"]+)['"]/g)].map(match => match[1]) : []
    for (const link of links) await checkLink(path, link, skill)
  }
  return files
}

// Check this repository's plain YAML metadata, portable links, and public README.
async function main () {
  const text = await readFile(join(skill, 'SKILL.md'), 'utf8')
  const header = text.match(/^---\n([\s\S]+?)\n---\n/)
  assert.ok(header, 'Missing skill frontmatter')
  assert.match(header[1], /^name: three-spatial$/m)
  assert.match(header[1], /^description: \S.+$/m)
  const files = await inspect(skill)
  const readme = join(repository, 'README.md')
  for (const match of (await readFile(readme, 'utf8')).matchAll(/\]\(([^)]+)\)/g)) await checkLink(readme, match[1], repository)
  console.log(`Skill metadata, ${files} portable files, imports, and documentation links are valid.`)
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
