import { describe, expect, test } from 'bun:test'

import type { Block } from '@features/block-schema'

import { blockEqual, mergeStreamingBlocks, type ReplyBlocksPart, replyPartEqual } from './messages'

const heading: Block = { type: 'heading', label: 'Experience' }
const tags: Block = { type: 'tags', items: ['TypeScript', 'Rust'] }

const blocks = (overrides: Partial<ReplyBlocksPart> = {}): ReplyBlocksPart => ({
  kind: 'blocks',
  id: 'call-1',
  blocks: [heading, tags],
  complete: true,
  ...overrides,
})

describe('blockEqual', () => {
  test('compares nested values structurally', () => {
    expect(blockEqual(tags, { type: 'tags', items: ['TypeScript', 'Rust'] })).toBe(true)
    expect(blockEqual(tags, { type: 'tags', items: ['TypeScript'] })).toBe(false)
    expect(blockEqual(heading, { type: 'heading', label: 'Experience', note: 'x' } as Block)).toBe(
      false
    )
    expect(blockEqual(heading, tags)).toBe(false)
  })
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

describe('mergeStreamingBlocks', () => {
  const prose: Block = { type: 'prose', text: 'Hello' }

  test('appends only the new blocks, keeping earlier ones', () => {
    const current: Block[] = [heading]
    mergeStreamingBlocks(current, [{ ...heading }, tags, prose])
    expect(current).toEqual([heading, tags, prose])
    expect(current[0]).toBe(heading)
  })

  test('is a no-op when the blocks are the same', () => {
    const current: Block[] = [heading, tags]
    mergeStreamingBlocks(current, JSON.parse(JSON.stringify(current)) as Block[])
    expect(current[0]).toBe(heading)
    expect(current[1]).toBe(tags)
    expect(current).toHaveLength(2)
  })

  test('replaces the last shared block when it differs', () => {
    const current: Block[] = [heading, tags]
    const changed: Block = { type: 'tags', items: ['Go'] }
    mergeStreamingBlocks(current, [heading, changed, prose])
    expect(current).toEqual([heading, changed, prose])
    expect(current[1]).toBe(changed)
  })

  test('drops blocks the next list no longer has', () => {
    const current: Block[] = [heading, tags, prose]
    mergeStreamingBlocks(current, [heading])
    expect(current).toEqual([heading])
    mergeStreamingBlocks(current, [])
    expect(current).toEqual([])
  })
})
