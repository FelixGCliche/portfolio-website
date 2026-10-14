import { describe, expect, test } from 'bun:test'

import type { Block } from '@features/block-schema'

import { type ReplyBlocksPart, replyPartEqual } from './messages'

const heading: Block = { type: 'heading', label: 'Experience' }
const tags: Block = { type: 'tags', items: ['TypeScript', 'Rust'] }

const blocks = (overrides: Partial<ReplyBlocksPart> = {}): ReplyBlocksPart => ({
  kind: 'blocks',
  id: 'call-1',
  blocks: [heading, tags],
  complete: true,
  ...overrides,
})

describe('replyPartEqual', () => {
  test('compares text parts by text', () => {
    expect(replyPartEqual({ kind: 'text', text: 'Hi' }, { kind: 'text', text: 'Hi' })).toBe(true)
    expect(replyPartEqual({ kind: 'text', text: 'Hi' }, { kind: 'text', text: 'Hi!' })).toBe(false)
  })

  test('never equates parts of different kinds', () => {
    expect(replyPartEqual({ kind: 'text', text: 'Hi' }, blocks())).toBe(false)
    expect(replyPartEqual(blocks(), { kind: 'text', text: 'Hi' })).toBe(false)
  })

  test('compares blocks parts by value', () => {
    const copy = blocks({ blocks: JSON.parse(JSON.stringify([heading, tags])) as Block[] })
    expect(replyPartEqual(blocks(), copy)).toBe(true)
  })

  test('tells blocks parts apart by id, completeness and blocks', () => {
    expect(replyPartEqual(blocks(), blocks({ id: 'call-2' }))).toBe(false)
    expect(replyPartEqual(blocks(), blocks({ complete: false }))).toBe(false)
    expect(replyPartEqual(blocks(), blocks({ blocks: [heading] }))).toBe(false)
    expect(
      replyPartEqual(blocks(), blocks({ blocks: [heading, { type: 'tags', items: ['Go'] }] }))
    ).toBe(false)
  })
})
