import { describe, expect, test } from 'bun:test'

import type { ModelMessage } from '@tanstack/ai'

import {
  createAgentLoopStrategy,
  hasRenderedBlocksThisRun,
  stopAfterRenderBlocks,
} from './loopStrategy'

const call = (name: string, id = 'call-1') => ({
  id,
  type: 'function' as const,
  function: { name, arguments: '{}' },
})

const user: ModelMessage = { role: 'user', content: 'compare my roles' }
const blocksTurn: ModelMessage = {
  role: 'assistant',
  content: '',
  toolCalls: [call('render_blocks')],
}
const toolResult: ModelMessage = { role: 'tool', content: '{}', toolCallId: 'call-1' }

const state = (messages: ModelMessage[], iterationCount = 0) => ({
  iterationCount,
  messages,
  finishReason: 'tool_calls',
  toolCallCount: 1,
  lastTurnToolCallCount: 1,
})

describe('hasRenderedBlocksThisRun', () => {
  test('is false before any render_blocks call', () => {
    expect(hasRenderedBlocksThisRun([user])).toBe(false)
  })

  test('is true once render_blocks was called after the latest user message', () => {
    expect(hasRenderedBlocksThisRun([user, blocksTurn, toolResult])).toBe(true)
  })

  test('ignores render_blocks calls from earlier turns of the conversation', () => {
    const next: ModelMessage = { role: 'user', content: 'and your skills?' }
    expect(hasRenderedBlocksThisRun([user, blocksTurn, toolResult, next])).toBe(false)
  })

  test('ignores other tools', () => {
    const themeTurn: ModelMessage = {
      role: 'assistant',
      content: '',
      toolCalls: [call('set_theme')],
    }
    expect(hasRenderedBlocksThisRun([user, themeTurn])).toBe(false)
  })
})

describe('agent loop strategy', () => {
  test('continues after other tools and stops after render_blocks', () => {
    const themeTurn: ModelMessage = {
      role: 'assistant',
      content: '',
      toolCalls: [call('set_theme')],
    }
    expect(stopAfterRenderBlocks(state([user, themeTurn]))).toBe(true)
    expect(stopAfterRenderBlocks(state([user, blocksTurn, toolResult]))).toBe(false)
  })

  test('still enforces the turn limit', () => {
    const strategy = createAgentLoopStrategy(2)
    expect(strategy(state([user], 1))).toBe(true)
    expect(strategy(state([user], 2))).toBe(false)
  })
})
