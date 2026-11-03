import { describe, expect, test } from 'bun:test'

import type { ModelMessage } from '@tanstack/ai'

import { createAgentLoopStrategy, endedWithShownAnswer, stopAfterShownAnswer } from './loopStrategy'

const call = (name: string, id = 'call-1') => ({
  id,
  type: 'function' as const,
  function: { name, arguments: '{}' },
})

const result = (toolCallId: string): ModelMessage => ({ role: 'tool', content: '{}', toolCallId })

const turn = (...calls: ReturnType<typeof call>[]): ModelMessage => ({
  role: 'assistant',
  content: '',
  toolCalls: calls,
})

const user: ModelMessage = { role: 'user', content: 'compare my roles' }
const blocksTurn = turn(call('render_blocks'))
const topicTurn = turn(call('show_topic'))
const toolResult = result('call-1')

/** One turn that renders blocks and also shows a topic. */
const blocksAndTopicTurn = turn(call('render_blocks', 'call-1'), call('show_topic', 'call-2'))

const failedResult = (toolCallId: string): ModelMessage => ({
  role: 'tool',
  content: '{"error":"show_topic failed: navigation blocked"}',
  toolCallId,
})

const state = (messages: ModelMessage[], iterationCount = 0) => ({
  iterationCount,
  messages,
  finishReason: 'tool_calls',
  toolCallCount: 1,
  lastTurnToolCallCount: 1,
})

describe('endedWithShownAnswer', () => {
  test('is false before any tool call', () => {
    expect(endedWithShownAnswer([user])).toBe(false)
  })

  test('is true once a render_blocks-only turn succeeded after the latest user message', () => {
    expect(endedWithShownAnswer([user, blocksTurn, toolResult])).toBe(true)
  })

  test('is false until the render_blocks call has a result', () => {
    expect(endedWithShownAnswer([user, blocksTurn])).toBe(false)
  })

  test('is false when the render_blocks call failed, so the model can retry', () => {
    const failed: ModelMessage = {
      role: 'tool',
      content: '{"error":"Input validation failed for tool render_blocks"}',
      toolCallId: 'call-1',
      error: 'Input validation failed for tool render_blocks',
    }
    expect(endedWithShownAnswer([user, blocksTurn, failed])).toBe(false)
    const retry = turn(call('render_blocks', 'call-2'))
    expect(endedWithShownAnswer([user, blocksTurn, failed, retry, result('call-2')])).toBe(true)
  })

  test('is false when the failure is only reported in the tool message content', () => {
    const failed: ModelMessage = {
      role: 'tool',
      content: '{"error":"Input validation failed for tool render_blocks"}',
      toolCallId: 'call-1',
    }
    expect(endedWithShownAnswer([user, blocksTurn, failed])).toBe(false)
  })

  test('ignores tool calls from earlier turns of the conversation', () => {
    const next: ModelMessage = { role: 'user', content: 'and your skills?' }
    expect(endedWithShownAnswer([user, blocksTurn, toolResult, next])).toBe(false)
    expect(endedWithShownAnswer([user, topicTurn, toolResult, next])).toBe(false)
  })

  test('ignores other tools', () => {
    expect(endedWithShownAnswer([user, turn(call('set_theme')), result('call-1')])).toBe(false)
  })

  test('is true once a show_topic-only turn succeeded', () => {
    expect(endedWithShownAnswer([user, topicTurn])).toBe(false)
    expect(endedWithShownAnswer([user, topicTurn, toolResult])).toBe(true)
  })

  test('is false when show_topic failed, so the model can retry', () => {
    expect(endedWithShownAnswer([user, topicTurn, failedResult('call-1')])).toBe(false)
    const withError: ModelMessage = {
      role: 'tool',
      content: '{}',
      toolCallId: 'call-1',
      error: 'navigation blocked',
    }
    expect(endedWithShownAnswer([user, topicTurn, withError])).toBe(false)
  })

  test('is true once show_topic and a single render_blocks in one turn both succeeded', () => {
    expect(endedWithShownAnswer([user, blocksAndTopicTurn, toolResult])).toBe(false)
    expect(endedWithShownAnswer([user, blocksAndTopicTurn, toolResult, result('call-2')])).toBe(
      true
    )
    expect(
      endedWithShownAnswer([user, blocksAndTopicTurn, toolResult, failedResult('call-2')])
    ).toBe(false)
  })

  test('is false when show_topic is mixed with another tool or repeated', () => {
    const withTheme = turn(call('show_topic', 'call-1'), call('set_theme', 'call-2'))
    expect(endedWithShownAnswer([user, withTheme, toolResult, result('call-2')])).toBe(false)
    const twoTopics = turn(call('show_topic', 'call-1'), call('show_topic', 'call-2'))
    expect(endedWithShownAnswer([user, twoTopics, toolResult, result('call-2')])).toBe(false)
    const twoBlocks = turn(
      call('show_topic', 'call-1'),
      call('render_blocks', 'call-2'),
      call('render_blocks', 'call-3')
    )
    expect(
      endedWithShownAnswer([user, twoBlocks, toolResult, result('call-2'), result('call-3')])
    ).toBe(false)
  })

  test('is false when render_blocks is mixed with another tool', () => {
    const withTheme = turn(call('render_blocks', 'call-1'), call('set_theme', 'call-2'))
    expect(endedWithShownAnswer([user, withTheme, toolResult, result('call-2')])).toBe(false)
  })

  test('is false when a later turn called another tool after render_blocks returned', () => {
    const themeTurn = turn(call('set_theme', 'call-2'))
    expect(endedWithShownAnswer([user, blocksTurn, toolResult, themeTurn, result('call-2')])).toBe(
      false
    )
  })
})

describe('agent loop strategy', () => {
  test('continues after other tools and stops after a shown answer', () => {
    expect(stopAfterShownAnswer(state([user, turn(call('set_theme')), result('call-1')]))).toBe(
      true
    )
    expect(stopAfterShownAnswer(state([user, blocksTurn, toolResult]))).toBe(false)
    expect(stopAfterShownAnswer(state([user, topicTurn, toolResult]))).toBe(false)
  })

  test('continues while a client tool result is still pending', () => {
    // The server answered render_blocks inline, but the browser has not yet run show_topic.
    expect(stopAfterShownAnswer(state([user, blocksAndTopicTurn, toolResult]))).toBe(true)
  })

  test('stops on a continuation request carrying a successful show_topic result', () => {
    const continuation = [user, blocksAndTopicTurn, toolResult, result('call-2')]
    expect(stopAfterShownAnswer(state(continuation))).toBe(false)
  })

  test('still enforces the turn limit', () => {
    const strategy = createAgentLoopStrategy(2)
    expect(strategy(state([user], 1))).toBe(true)
    expect(strategy(state([user], 2))).toBe(false)
  })
})
