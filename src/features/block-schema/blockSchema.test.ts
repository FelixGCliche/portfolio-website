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

  test.each([
    '(418) 805-6251',
    'Call 418-805-6251',
    '418.805.6251',
    '4188056251',
    '+1 418 805 6251',
    '+44 20 7946 0958',
    '555-1234',
    '41 88 05 62 51',
  ])('rejects a phone number %p in any text field', (phone) => {
    expect(ok({ type: 'heading', label: phone })).toBe(false)
    expect(ok({ type: 'prose', text: `Reach me at ${phone}.` })).toBe(false)
    expect(ok({ type: 'keyValue', rows: [{ key: 'Phone', value: phone }] })).toBe(false)
    expect(ok({ type: 'list', items: [phone] })).toBe(false)
    expect(ok({ type: 'table', columns: ['a', 'b'], rows: [['x', phone]] })).toBe(false)
    expect(
      ok({ type: 'timeline', items: [{ title: 'Dev', range: '2021', bullets: [phone] }] })
    ).toBe(false)
    expect(ok({ type: 'links', items: [{ ...validBlocks.links.items[1], value: phone }] })).toBe(
      false
    )
  })

  test.each(['2021 – 2024', '2019-2024', 'Jan 2021 - Dec 2024', '5 years, 12 projects', '100 000'])(
    'accepts number-bearing text %p that is not a phone number',
    (value) => {
      expect(ok({ type: 'keyValue', rows: [{ key: 'Facts', value }] })).toBe(true)
    }
  )

  test.each([
    { label: 'Email', value: 'someone@evil.com', href: `mailto:${email}` },
    { label: 'someone@evil.com', value: email, href: `mailto:${email}` },
    { label: 'GitHub', value: email, href: 'https://github.com/FelixGCliche' },
    { label: 'GitHub', value: 'github.com/someone-else', href: 'https://github.com/FelixGCliche' },
    { label: 'GitHub', value: 'https://evil.com/x', href: 'https://github.com/FelixGCliche' },
    { label: 'evil.com', value: 'FelixGCliche', href: 'https://github.com/FelixGCliche' },
    { label: 'Email', value: 'gagnecliche.dev', href: `mailto:${email}` },
  ])('rejects link text naming another target %p', (item) => {
    expect(ok({ type: 'links', items: [item] })).toBe(false)
  })

  test.each([
    { label: 'Email', value: email.toUpperCase(), href: `mailto:${email}` },
    { label: 'Email', value: `mailto:${email}`, href: `mailto:${email}?subject=Hi` },
    { label: 'GitHub', value: 'github.com/FelixGCliche', href: 'https://github.com/FelixGCliche' },
    {
      label: 'GitHub',
      value: 'https://github.com/FelixGCliche/',
      href: 'https://github.com/FelixGCliche',
    },
    { label: 'LinkedIn', value: 'linkedin.com/in/x', href: 'https://www.linkedin.com/in/x' },
    { label: 'github.com', value: 'FelixGCliche', href: 'https://github.com/FelixGCliche' },
  ])('accepts link text matching its target %p', (item) => {
    expect(ok({ type: 'links', items: [item] })).toBe(true)
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
