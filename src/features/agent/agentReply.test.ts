import { describe, expect, spyOn, test } from 'bun:test'

import type { UIMessage } from '@tanstack/ai-client'

import * as blockSchemaModule from '@features/block-schema'
import { type Block, MAX_BLOCKS } from '@features/block-schema'
import type { ReplyPart } from '@features/conversation'

import { mapTurnReply, replyParts, turnMessages } from './agentReply'

const user = (id: string, content: string): UIMessage => ({
  id,
  role: 'user',
  parts: [{ type: 'text', content }],
})

const assistant = (id: string, ...texts: string[]): UIMessage => ({
  id,
  role: 'assistant',
  parts: texts.map((content) => ({ type: 'text', content })),
})

const toolCall: UIMessage = {
  id: 'a-tool',
  role: 'assistant',
  parts: [
    {
      type: 'tool-call',
      id: 'call-1',
      name: 'show_topic',
      arguments: '{"key":"/work"}',
      state: 'input-complete',
    },
  ],
}

const idle = { isLoading: false, hasError: false }
const loading = { isLoading: true, hasError: false }

const text = (value: string): ReplyPart => ({ kind: 'text', text: value })
const blocksPart = (id: string, blocks: Block[], complete = true): ReplyPart => ({
  kind: 'blocks',
  id,
  blocks,
  complete,
})

const heading: Block = { type: 'heading', label: 'Experience' }
const tags: Block = { type: 'tags', items: ['TypeScript', 'Rust'] }

type CallState = 'awaiting-input' | 'input-streaming' | 'input-complete' | 'complete' | 'error'

const blocksCall = (id: string, args: string, state: CallState = 'input-complete') => ({
  type: 'tool-call' as const,
  id,
  name: 'render_blocks',
  arguments: args,
  state,
})

const message = (id: string, parts: UIMessage['parts']): UIMessage => ({
  id,
  role: 'assistant',
  parts,
})

const fullArgs = JSON.stringify({ blocks: [heading, tags] })

describe('turnMessages', () => {
  test('returns the messages between the user message and the next one', () => {
    const messages = [user('u1', 'hi'), assistant('a1', 'hello'), user('u2', 'more')]
    expect(turnMessages(messages, 'u1')?.map((m) => m.id)).toEqual(['a1'])
    expect(turnMessages(messages, 'u2')).toEqual([])
  })

  test('is undefined until the user message reaches the client', () => {
    expect(turnMessages([], 'u1')).toBeUndefined()
    expect(turnMessages([assistant('u1', 'x')], 'u1')).toBeUndefined()
  })
})

describe('replyParts', () => {
  test('keeps non-blank assistant text parts and drops other tool calls', () => {
    const messages = [assistant('a1', ' Sure ', '  '), toolCall, assistant('a2', 'Here it is.')]
    expect(replyParts(messages)).toEqual([text('Sure'), text('Here it is.')])
  })

  test('ignores user and thinking content', () => {
    const thinking: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [{ type: 'thinking', content: 'secret plan' }],
    }
    expect(replyParts([user('u1', 'hi'), thinking])).toEqual([])
  })

  test('interleaves text and blocks in order', () => {
    const messages = [
      message('a1', [
        { type: 'text', content: 'Here you go:' },
        blocksCall('call-1', fullArgs),
        {
          type: 'tool-result',
          toolCallId: 'call-1',
          content: '{"status":"rendered","count":2}',
          state: 'complete',
        },
        { type: 'text', content: 'Anything else?' },
      ]),
    ]
    expect(replyParts(messages)).toEqual([
      text('Here you go:'),
      blocksPart('call-1', [heading, tags]),
      text('Anything else?'),
    ])
  })

  test('reads parsed input when the call carries it', () => {
    const messages = [message('a1', [{ ...blocksCall('call-1', ''), input: { blocks: [tags] } }])]
    expect(replyParts(messages)).toEqual([blocksPart('call-1', [tags])])
  })

  test('shows only finished blocks while the arguments stream in', () => {
    const partial = `{"blocks":[${JSON.stringify(heading)},{"type":"tags","items":["Type`
    expect(replyParts([message('a1', [blocksCall('call-1', partial, 'input-streaming')])])).toEqual(
      [blocksPart('call-1', [heading], false)]
    )
  })

  test('drops invalid blocks and omits calls without any valid block', () => {
    const args = JSON.stringify({ blocks: [{ type: 'nope' }, tags] })
    expect(replyParts([message('a1', [blocksCall('call-1', args)])])).toEqual([
      blocksPart('call-1', [tags]),
    ])
    const streaming = `{"blocks":[{"type":"head`
    expect(
      replyParts([
        message('a1', [
          blocksCall('call-1', '', 'awaiting-input'),
          blocksCall('call-2', streaming, 'input-streaming'),
          blocksCall('call-3', '{"blocks":[]}'),
          blocksCall('call-4', 'not json'),
        ]),
      ])
    ).toEqual([])
  })

  test('omits calls that errored or that the server rejected', () => {
    expect(replyParts([message('a1', [blocksCall('call-1', fullArgs, 'error')])])).toEqual([])
    const rejected = (result: UIMessage['parts'][number]) =>
      replyParts([message('a1', [blocksCall('call-1', fullArgs, 'complete'), result])])
    expect(
      rejected({ type: 'tool-result', toolCallId: 'call-1', content: 'bad', state: 'error' })
    ).toEqual([])
    expect(
      rejected({
        type: 'tool-result',
        toolCallId: 'call-1',
        content: '{"error":"Too many blocks"}',
        state: 'complete',
      })
    ).toEqual([])
    expect(
      rejected({ type: 'tool-result', toolCallId: 'other', content: 'bad', state: 'error' })
    ).toEqual([blocksPart('call-1', [heading, tags])])
  })

  test('completes a call the stream ended in, dropping a cut-off last block', () => {
    const partial = `{"blocks":[${JSON.stringify(heading)},{"type":"tags","items":["Type`
    expect(
      replyParts([message('a1', [blocksCall('call-1', partial, 'input-streaming')])], true)
    ).toEqual([blocksPart('call-1', [heading])])
    expect(
      replyParts([message('a1', [blocksCall('call-1', fullArgs, 'input-streaming')])], true)
    ).toEqual([blocksPart('call-1', [heading, tags])])
  })
})

describe('replyParts streaming cache', () => {
  const headings = (count: number): Block[] =>
    Array.from({ length: count }, (_, i) => ({ type: 'heading', label: `H${i}` }))

  // The blocks shown for one call with `args`, in `state`.
  const shown = (id: string, args: string, state: CallState, settled = false): Block[] => {
    const [part] = replyParts([message('a1', [blocksCall(id, args, state)])], settled)
    return part?.kind === 'blocks' ? part.blocks : []
  }

  // Every prefix of `args`, as the arguments of a streaming call.
  const stream = (id: string, args: string): Block[][] =>
    Array.from({ length: args.length }, (_, i) =>
      shown(id, args.slice(0, i + 1), 'input-streaming')
    )

  test('streams append-only blocks that keep their identity', () => {
    const all = headings(3)
    const args = JSON.stringify({ blocks: all })
    let previous: Block[] = []
    for (const blocks of stream('cache-append', args)) {
      expect(blocks.length).toBeGreaterThanOrEqual(previous.length)
      previous.forEach((block, i) => expect(blocks[i]).toBe(block))
      previous = blocks
    }
    expect(previous).toEqual(all.slice(0, 2))
    const final = shown('cache-append', args, 'input-complete')
    expect(final).toEqual(all)
    expect(final[0]).toBe(previous[0])
    expect(final[1]).toBe(previous[1])
  })

  test('validates each closed element once', () => {
    const spy = spyOn(blockSchemaModule, 'parseBlocksLenient')
    try {
      const args = JSON.stringify({ blocks: headings(4) })
      stream('cache-once', args)
      shown('cache-once', args, 'input-complete')
      const validated = spy.mock.calls.reduce(
        (count, [value]) => count + (Array.isArray(value) ? value.length : 0),
        0
      )
      expect(validated).toBe(4)
    } finally {
      spy.mockRestore()
    }
  })

  test('appends the held-back block once when the stream settles', () => {
    const args = JSON.stringify({ blocks: headings(3) })
    const streaming = shown('cache-settle', args, 'input-streaming')
    expect(streaming).toEqual(headings(2))
    const settled = shown('cache-settle', args, 'input-streaming', true)
    expect(settled).toEqual(headings(3))
    expect(settled[0]).toBe(streaming[0])
    expect(shown('cache-settle', args, 'input-streaming', true)).toEqual(headings(3))
  })

  test('caps the blocks at MAX_BLOCKS across chunks, skipping invalid ones', () => {
    const all = headings(MAX_BLOCKS + 2)
    const args = JSON.stringify({ blocks: [{ type: 'nope' }, ...all] })
    for (const blocks of stream('cache-cap', args))
      expect(blocks.length).toBeLessThanOrEqual(MAX_BLOCKS)
    expect(shown('cache-cap', args, 'input-complete')).toEqual(all.slice(0, MAX_BLOCKS))
  })

  test('does not re-parse a finished call on later reads', () => {
    const spy = spyOn(blockSchemaModule, 'parseBlocksLenient')
    try {
      const args = JSON.stringify({ blocks: headings(3) })
      const first = shown('cache-final', args, 'complete')
      const calls = spy.mock.calls.length
      const again = shown('cache-final', args, 'complete')
      expect(spy.mock.calls.length).toBe(calls)
      expect(again).toEqual(first)
      expect(again).not.toBe(first)
      expect(again[0]).toBe(first[0])
    } finally {
      spy.mockRestore()
    }
  })

  test('does not reuse a finished call for other arguments or a streaming read', () => {
    const first = JSON.stringify({ blocks: headings(3) })
    expect(shown('cache-final-id', first, 'complete')).toEqual(headings(3))
    expect(shown('cache-final-id', first, 'input-streaming')).toEqual(headings(2))
    const other = JSON.stringify({ blocks: [tags] })
    expect(shown('cache-final-id', first, 'complete')).toEqual(headings(3))
    expect(shown('cache-final-id', other, 'complete')).toEqual([tags])
  })

  test('starts over when a call id is reused with other arguments', () => {
    const first = JSON.stringify({ blocks: headings(3) })
    expect(shown('cache-reuse', first, 'input-streaming')).toEqual(headings(2))
    const other = JSON.stringify({ blocks: [tags, heading, tags] })
    expect(shown('cache-reuse', other, 'input-streaming')).toEqual([tags, heading])
    expect(shown('cache-reuse', other, 'input-complete')).toEqual([tags, heading, tags])
  })
})

describe('mapTurnReply', () => {
  test('is pending before the user message is sent', () => {
    expect(mapTurnReply([], 'u1', idle)).toEqual({ parts: [], status: 'pending' })
  })

  test('is pending while loading without text', () => {
    const messages = [user('u1', 'hi'), toolCall]
    expect(mapTurnReply(messages, 'u1', { isLoading: true, hasError: false })).toEqual({
      parts: [],
      status: 'pending',
    })
  })

  test('is streaming while loading with text', () => {
    const messages = [user('u1', 'hi'), assistant('a1', 'Hel')]
    expect(mapTurnReply(messages, 'u1', { isLoading: true, hasError: false })).toEqual({
      parts: [text('Hel')],
      status: 'streaming',
    })
  })

  test('is done once the stream settles, even for tool-only replies', () => {
    expect(mapTurnReply([user('u1', 'hi'), assistant('a1', 'Hello!')], 'u1', idle)).toEqual({
      parts: [text('Hello!')],
      status: 'done',
    })
    expect(mapTurnReply([user('u1', 'show work'), toolCall], 'u1', idle)).toEqual({
      parts: [],
      status: 'done',
    })
  })

  test('is an error when the stream failed, keeping any partial text', () => {
    const messages = [user('u1', 'hi'), assistant('a1', 'Partial')]
    expect(mapTurnReply(messages, 'u1', { isLoading: false, hasError: true })).toEqual({
      parts: [text('Partial')],
      status: 'error',
    })
  })

  test('only reads its own turn', () => {
    const messages = [
      user('u1', 'first'),
      assistant('a1', 'One'),
      user('u2', 'second'),
      assistant('a2', 'Two'),
    ]
    expect(mapTurnReply(messages, 'u1', idle).parts).toEqual([text('One')])
    expect(mapTurnReply(messages, 'u2', idle).parts).toEqual([text('Two')])
  })

  test('follows a blocks-only reply from pending to done', () => {
    const turn = (parts: UIMessage['parts']) => [user('u1', 'career'), message('a1', parts)]
    const partial = `{"blocks":[${JSON.stringify(heading)},{"type":"ta`
    const done = blocksPart('call-1', [heading, tags])

    expect(mapTurnReply(turn([blocksCall('call-1', '', 'awaiting-input')]), 'u1', loading)).toEqual(
      { parts: [], status: 'pending' }
    )
    expect(
      mapTurnReply(turn([blocksCall('call-1', partial, 'input-streaming')]), 'u1', loading)
    ).toEqual({
      parts: [blocksPart('call-1', [heading], false)],
      status: 'streaming',
    })
    expect(mapTurnReply(turn([blocksCall('call-1', fullArgs)]), 'u1', loading)).toEqual({
      parts: [done],
      status: 'streaming',
    })
    expect(mapTurnReply(turn([blocksCall('call-1', fullArgs, 'complete')]), 'u1', idle)).toEqual({
      parts: [done],
      status: 'done',
    })
  })
})
