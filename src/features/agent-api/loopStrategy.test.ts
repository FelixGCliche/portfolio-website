import { describe, expect, test } from 'bun:test'

import type { ModelMessage } from '@tanstack/ai'

import {
  createAgentLoopStrategy,
  endedWithRenderedBlocks,
  stopAfterRenderBlocks,
} from './loopStrategy'

const call = (name: string, id = 'call-1') => ({
  id,
  type: 'function' as const,
  function: { name, arguments: '{}' },
})

const result = (toolCallId: string): ModelMessage => ({ role: 'tool', content: '{}', toolCallId })

const user: ModelMessage = { role: 'user', content: 'compare my roles' }
const blocksTurn: ModelMessage = {
  role: 'assistant',
  content: '',
  toolCalls: [call('render_blocks')],
}
const toolResult = result('call-1')

/** One turn that renders blocks and also calls a client tool. */
const mixedTurn: ModelMessage = {
  role: 'assistant',
  content: '',
  toolCalls: [call('render_blocks', 'call-1'), call('show_topic', 'call-2')],
}

const state = (messages: ModelMessage[], iterationCount = 0) => ({
  iterationCount,
  messages,
  finishReason: 'tool_calls',
  toolCallCount: 1,
  lastTurnToolCallCount: 1,
})

describe('endedWithRenderedBlocks', () => {
  test('is false before any render_blocks call', () => {
    expect(endedWithRenderedBlocks([user])).toBe(false)
  })

  test('is true once a render_blocks-only turn succeeded after the latest user message', () => {
    expect(endedWithRenderedBlocks([user, blocksTurn, toolResult])).toBe(true)
  })

  test('is false until the render_blocks call has a result', () => {
    expect(endedWithRenderedBlocks([user, blocksTurn])).toBe(false)
  })

  test('is false when the render_blocks call failed, so the model can retry', () => {
    const failed: ModelMessage = {
      role: 'tool',
      content: '{"error":"Input validation failed for tool render_blocks"}',
      toolCallId: 'call-1',
      error: 'Input validation failed for tool render_blocks',
    }
    expect(endedWithRenderedBlocks([user, blocksTurn, failed])).toBe(false)
    const retry: ModelMessage = {
      role: 'assistant',
      content: '',
      toolCalls: [call('render_blocks', 'call-2')],
    }
    expect(endedWithRenderedBlocks([user, blocksTurn, failed, retry, result('call-2')])).toBe(true)
  })

  test('is false when the failure is only reported in the tool message content', () => {
    const failed: ModelMessage = {
      role: 'tool',
      content: '{"error":"Input validation failed for tool render_blocks"}',
      toolCallId: 'call-1',
    }
    expect(endedWithRenderedBlocks([user, blocksTurn, failed])).toBe(false)
  })

  test('ignores render_blocks calls from earlier turns of the conversation', () => {
    const next: ModelMessage = { role: 'user', content: 'and your skills?' }
    expect(endedWithRenderedBlocks([user, blocksTurn, toolResult, next])).toBe(false)
  })

  test('ignores other tools', () => {
    const themeTurn: ModelMessage = {
      role: 'assistant',
      content: '',
      toolCalls: [call('set_theme')],
    }
    expect(endedWithRenderedBlocks([user, themeTurn, result('call-1')])).toBe(false)
  })

  test('is false when the same turn also called a client tool', () => {
    expect(endedWithRenderedBlocks([user, mixedTurn, toolResult])).toBe(false)
    expect(endedWithRenderedBlocks([user, mixedTurn, toolResult, result('call-2')])).toBe(false)
  })

  test('is false when a later turn called another tool after render_blocks returned', () => {
    const themeTurn: ModelMessage = {
      role: 'assistant',
      content: '',
      toolCalls: [call('set_theme', 'call-2')],
    }
    expect(
      endedWithRenderedBlocks([user, blocksTurn, toolResult, themeTurn, result('call-2')])
    ).toBe(false)
  })
})

describe('agent loop strategy', () => {
  test('continues after other tools and stops after a render_blocks-only turn', () => {
    const themeTurn: ModelMessage = {
      role: 'assistant',
      content: '',
      toolCalls: [call('set_theme')],
    }
    expect(stopAfterRenderBlocks(state([user, themeTurn, result('call-1')]))).toBe(true)
    expect(stopAfterRenderBlocks(state([user, blocksTurn, toolResult]))).toBe(false)
  })

  test('continues on a continuation request carrying client tool results', () => {
    // The browser ran show_topic and sent its result back; the earlier render_blocks result is
    // still in the run, but the model has not yet seen the client tool result.
    const continuation = [user, mixedTurn, toolResult, result('call-2')]
    expect(stopAfterRenderBlocks(state(continuation))).toBe(true)
  })

  test('still enforces the turn limit', () => {
    const strategy = createAgentLoopStrategy(2)
    expect(strategy(state([user], 1))).toBe(true)
    expect(strategy(state([user], 2))).toBe(false)
  })
})
