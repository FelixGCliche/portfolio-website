import { describe, expect, test } from 'bun:test'

import { profile } from '@content'
import { z } from 'zod'

import { TOPIC_KEYS } from '@features/topic-keys'

import {
  type Block,
  blockSchema,
  type BlockType,
  MAX_BLOCKS,
  parseBlocksLenient,
  renderBlocksInputSchema,
} from './blockSchema'

const email = profile[0]?.email ?? ''

const validBlocks = {
  heading: { type: 'heading', label: 'Experience', meta: '2021 – now', metaTone: 'success' },
  prose: { type: 'prose', text: 'I build **reliable** things.', tone: 'lead' },
  keyValue: { type: 'keyValue', rows: [{ key: 'Status', value: 'Available', tone: 'success' }] },
  list: { type: 'list', items: ['One', 'Two'] },
  tags: { type: 'tags', items: ['TypeScript', 'Rust'] },
  table: {
    type: 'table',
    columns: ['Skill', 'Years'],
    rows: [
      ['TypeScript', '5'],
      ['Rust', '2'],
    ],
  },
  toolRows: { type: 'toolRows', rows: [{ area: 'Frontend', tools: ['SolidJS', 'React'] }] },
  timeline: {
    type: 'timeline',
    items: [
      {
        title: 'Developer',
        company: 'Acme',
        range: '2021 – now',
        current: true,
        bullets: ['Shipped'],
      },
    ],
  },
  links: {
    type: 'links',
    items: [
      { label: 'Email', value: email, href: `mailto:${email}` },
      { label: 'GitHub', value: 'FelixGCliche', href: 'https://github.com/FelixGCliche' },
      { label: 'LinkedIn', value: 'in/x', href: 'https://www.linkedin.com/in/x' },
    ],
  },
  next: { type: 'next', topics: ['/work', '/contact'] },
} satisfies Record<BlockType, Block>

const ok = (value: unknown) => blockSchema.safeParse(value).success

describe('blockSchema', () => {
  test.each(Object.entries(validBlocks))('accepts a %s block', (_, block) => {
    expect(blockSchema.parse(block)).toEqual(block)
  })

  test('accepts minimal blocks without optional fields', () => {
    expect(ok({ type: 'heading', label: 'Hi' })).toBe(true)
    expect(ok({ type: 'prose', text: 'Hi' })).toBe(true)
    expect(ok({ type: 'timeline', items: [{ title: 'Dev', range: '2021' }] })).toBe(true)
  })

  test('trims strings', () => {
    expect(blockSchema.parse({ type: 'heading', label: '  Hi  ' })).toEqual({
      type: 'heading',
      label: 'Hi',
    })
  })

  test.each([{ type: 'nope', label: 'x' }, { label: 'x' }, null, 'heading'])(
    'rejects unknown or malformed block %p',
    (block) => {
      expect(ok(block)).toBe(false)
    }
  )

  test.each([
    'https://evil.com/',
    'http://github.com/x',
    '//github.com/x',
    'https://github.com.evil.com/',
    'javascript:alert(1)',
    'mailto:someone@else.com',
    '/work',
    '',
  ])('rejects a links href of %p', (href) => {
    expect(ok({ type: 'links', items: [{ label: 'x', value: 'y', href }] })).toBe(false)
  })

  test.each(['/nope', 'work', ''])('rejects next topic %p', (topic) => {
    expect(ok({ type: 'next', topics: [topic] })).toBe(false)
  })

  test('rejects ragged table rows', () => {
    expect(ok({ ...validBlocks.table, rows: [['a', 'b'], ['c']] })).toBe(false)
    expect(ok({ ...validBlocks.table, rows: [['a', 'b', 'c']] })).toBe(false)
  })

  test('rejects oversized strings and arrays', () => {
    expect(ok({ type: 'heading', label: 'x'.repeat(81) })).toBe(false)
    expect(ok({ type: 'prose', text: 'x'.repeat(601) })).toBe(false)
    expect(ok({ type: 'tags', items: Array.from({ length: 17 }, (_, i) => `t${i}`) })).toBe(false)
    expect(ok({ type: 'list', items: Array.from({ length: 9 }, (_, i) => `i${i}`) })).toBe(false)
    expect(
      ok({ type: 'table', columns: ['a', 'b', 'c', 'd', 'e'], rows: [['1', '2', '3', '4', '5']] })
    ).toBe(false)
    expect(ok({ type: 'next', topics: ['/about', '/work', '/skills', '/resume'] })).toBe(false)
  })

  test('rejects empty strings and empty arrays', () => {
    expect(ok({ type: 'heading', label: '   ' })).toBe(false)
    expect(ok({ type: 'list', items: [] })).toBe(false)
    expect(ok({ type: 'table', columns: ['a'], rows: [['1']] })).toBe(false)
  })
})

describe('renderBlocksInputSchema', () => {
  const all = Object.values(validBlocks)

  test('accepts 1 to MAX_BLOCKS blocks', () => {
    expect(renderBlocksInputSchema.safeParse({ blocks: all.slice(0, MAX_BLOCKS) }).success).toBe(
      true
    )
    expect(renderBlocksInputSchema.safeParse({ blocks: all.slice(0, 1) }).success).toBe(true)
  })

  test('rejects no blocks or more than MAX_BLOCKS', () => {
    expect(MAX_BLOCKS).toBe(6)
    expect(renderBlocksInputSchema.safeParse({ blocks: [] }).success).toBe(false)
    expect(
      renderBlocksInputSchema.safeParse({ blocks: all.slice(0, MAX_BLOCKS + 1) }).success
    ).toBe(false)
  })

  test('converts to a JSON schema listing every block type', () => {
    const json = JSON.stringify(z.toJSONSchema(renderBlocksInputSchema))
    for (const type of Object.keys(validBlocks)) expect(json).toContain(`"${type}"`)
    for (const key of TOPIC_KEYS) expect(json).toContain(key)
  })
})

describe('parseBlocksLenient', () => {
  test.each([undefined, null, 'x', { blocks: [] }, 42])('returns [] for non-array %p', (value) => {
    expect(parseBlocksLenient(value)).toEqual([])
  })

  test('keeps the valid prefix and drops a truncated last element', () => {
    expect(
      parseBlocksLenient([
        validBlocks.heading,
        validBlocks.prose,
        { type: 'table', columns: ['a', 'b'], rows: [['1']] },
      ])
    ).toEqual([validBlocks.heading, validBlocks.prose])
  })

  test('drops invalid elements anywhere and keeps the rest in order', () => {
    expect(
      parseBlocksLenient([
        { type: 'nope' },
        validBlocks.tags,
        { type: 'heading' },
        validBlocks.next,
      ])
    ).toEqual([validBlocks.tags, validBlocks.next])
  })

  test('caps the result at MAX_BLOCKS', () => {
    expect(parseBlocksLenient(Object.values(validBlocks))).toHaveLength(MAX_BLOCKS)
  })
})
