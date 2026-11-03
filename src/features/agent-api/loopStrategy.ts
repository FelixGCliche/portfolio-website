import {
  type AgentLoopStrategy,
  combineStrategies,
  maxIterations,
  type ToolCall,
} from '@tanstack/ai'

import { isErrorContent, renderBlocksTool, showTopicTool } from '@features/agent-tools'

type LoopMessage = Parameters<AgentLoopStrategy>[0]['messages'][number]

const count = (calls: readonly ToolCall[], name: string) =>
  calls.filter((call) => call.function.name === name).length

/**
 * Whether a turn's tool calls already show the visitor the whole answer: only `render_blocks`
 * calls, or a single `show_topic` call (alone or alongside a single `render_blocks` call).
 */
const isTerminalTurn = (calls: readonly ToolCall[]): boolean => {
  const blocks = count(calls, renderBlocksTool.name)
  const topics = count(calls, showTopicTool.name)
  if (blocks + topics !== calls.length || calls.length === 0) return false
  return topics === 0 || (topics === 1 && blocks <= 1)
}

/**
 * True when the latest tool-calling turn since the visitor's last message only showed the answer
 * (see `isTerminalTurn`), and every one of those calls succeeded. A turn that also called another
 * tool (e.g. `set_theme`) needs a follow-up turn once its results are in, and a call whose result
 * carries an error (e.g. arguments that failed schema validation, or a failed navigation) leaves the
 * model another turn to retry. A terminal turn from earlier in the run does not count either.
 */
export const endedWithShownAnswer = (messages: readonly LoopMessage[]): boolean => {
  const lastUser = messages.findLastIndex((message) => message.role === 'user')
  const run = messages.slice(lastUser + 1)
  const lastToolTurn = run.findLast(
    (message) => message.role === 'assistant' && (message.toolCalls?.length ?? 0) > 0
  )
  const calls = lastToolTurn?.toolCalls ?? []
  if (!isTerminalTurn(calls)) return false
  return calls.every((call) =>
    run.some(
      (message) =>
        message.role === 'tool' &&
        message.toolCallId === call.id &&
        message.error === undefined &&
        !isErrorContent(message.content)
    )
  )
}

/**
 * Ends the run after a turn that only showed the answer (rendered blocks or a site topic): free
 * models tend to call `render_blocks` or `show_topic` again every turn, stacking duplicate or
 * placeholder output, and the shown content already carries the whole answer. The system prompt has
 * the model write any accompanying sentence before the call.
 */
export const stopAfterShownAnswer: AgentLoopStrategy = ({ messages }) =>
  !endedWithShownAnswer(messages)

export const createAgentLoopStrategy = (maxTurns: number): AgentLoopStrategy =>
  combineStrategies([maxIterations(maxTurns), stopAfterShownAnswer])
