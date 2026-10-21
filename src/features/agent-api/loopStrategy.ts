import { type AgentLoopStrategy, combineStrategies, maxIterations } from '@tanstack/ai'

import { renderBlocksTool } from '@features/agent-tools'

type LoopMessage = Parameters<AgentLoopStrategy>[0]['messages'][number]

/**
 * True when the latest tool-calling turn since the visitor's last message called only
 * `render_blocks`, and every one of those calls succeeded. A turn that also called another tool
 * (e.g. a client tool like `show_topic`) needs a follow-up turn once its results are in, and a call
 * whose result carries an error (e.g. arguments that failed schema validation) leaves the model
 * another turn to retry. A `render_blocks` call from an earlier turn of the run (e.g. before a
 * client tool result came back) does not count either.
 */
export const endedWithRenderedBlocks = (messages: readonly LoopMessage[]): boolean => {
  const lastUser = messages.findLastIndex((message) => message.role === 'user')
  const run = messages.slice(lastUser + 1)
  const lastToolTurn = run.findLast(
    (message) => message.role === 'assistant' && (message.toolCalls?.length ?? 0) > 0
  )
  const calls = lastToolTurn?.toolCalls ?? []
  if (calls.length === 0 || calls.some((call) => call.function.name !== renderBlocksTool.name)) {
    return false
  }
  return calls.every((call) =>
    run.some(
      (message) =>
        message.role === 'tool' && message.toolCallId === call.id && message.error === undefined
    )
  )
}

/**
 * Ends the run after a turn that only rendered blocks: free models tend to call `render_blocks`
 * again every turn, stacking duplicate or placeholder blocks, and the blocks already carry the whole
 * answer. The system prompt has the model write any accompanying sentence before the call.
 */
export const stopAfterRenderBlocks: AgentLoopStrategy = ({ messages }) =>
  !endedWithRenderedBlocks(messages)

export const createAgentLoopStrategy = (maxTurns: number): AgentLoopStrategy =>
  combineStrategies([maxIterations(maxTurns), stopAfterRenderBlocks])
