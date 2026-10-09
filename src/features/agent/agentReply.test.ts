import { describe, expect, test } from 'bun:test'

import type { UIMessage } from '@tanstack/ai-client'

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
  test('keeps non-blank assistant text parts and drops tool calls', () => {
    const messages = [assistant('a1', ' Sure ', '  '), toolCall, assistant('a2', 'Here it is.')]
    expect(replyParts(messages)).toEqual(['Sure', 'Here it is.'])
  })

  test('ignores user and thinking content', () => {
    const thinking: UIMessage = {
      id: 'a1',
      role: 'assistant',
      parts: [{ type: 'thinking', content: 'secret plan' }],
    }
    expect(replyParts([user('u1', 'hi'), thinking])).toEqual([])
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
      parts: ['Hel'],
      status: 'streaming',
    })
  })

  test('is done once the stream settles, even for tool-only replies', () => {
    expect(mapTurnReply([user('u1', 'hi'), assistant('a1', 'Hello!')], 'u1', idle)).toEqual({
      parts: ['Hello!'],
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
      parts: ['Partial'],
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
    expect(mapTurnReply(messages, 'u1', idle).parts).toEqual(['One'])
    expect(mapTurnReply(messages, 'u2', idle).parts).toEqual(['Two'])
  })
})
