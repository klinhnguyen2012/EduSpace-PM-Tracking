import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('places the task expand button beside the title at the right edge', async () => {
  const page = await readFile(new URL('../src/app/task-timeline/page.tsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/app/globals.css', import.meta.url), 'utf8')
  const titleHeader = page.match(/<div className="task-title-header">([\s\S]*?)<\/div>/)?.[1]

  assert.ok(titleHeader, 'task title header should group the title and expand button')
  assert.ok(titleHeader.indexOf('<strong>') < titleHeader.indexOf('<ExpandButton'), 'the expand button should follow the title in the same row')

  const headerStyles = css.match(/\.task-title-header\s*\{([^}]+)\}/)?.[1]
  assert.ok(headerStyles, 'task title header styles should be defined')
  assert.match(headerStyles, /display:\s*flex/)
  assert.match(headerStyles, /justify-content:\s*space-between/)
})
