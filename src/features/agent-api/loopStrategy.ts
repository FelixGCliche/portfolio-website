import { type AgentLoopStrategy, combineStrategies, maxIterations } from '@tanstack/ai'

import { renderBlocksTool } from '@features/agent-tools'

type LoopMessage = Parameters<AgentLoopStrategy>[0]['messages'][number]

/**
 * True once a `render_blocks` call made after the visitor's latest message has succeeded. A call
 * whose result carries an error (e.g. arguments that failed schema validation) does not count, so
 * the model gets another turn to retry.
 */
export const hasRenderedBlocksThisRun = (messages: readonly LoopMessage[]): boolean => {
  const lastUser = messages.findLastIndex((message) => message.role === 'user')
  const run = messages.slice(lastUser + 1)
  const renderCallIds = new Set(
    run.flatMap((message) =>
      message.role === 'assistant'
        ? (message.toolCalls ?? [])
            .filter((call) => call.function.name === renderBlocksTool.name)
            .map((call) => call.id)
        : []
    )
  )
  return run.some(
    (message) =>
      message.role === 'tool' &&
      message.toolCallId !== undefined &&
      renderCallIds.has(message.toolCallId) &&
      message.error === undefined
  )
}

/**
 * Ends the run after `render_blocks`: free models tend to call it again every turn, stacking
 * duplicate or placeholder blocks. The blocks already carry the whole answer.
 */
export const stopAfterRenderBlocks: AgentLoopStrategy = ({ messages }) =>
  !hasRenderedBlocksThisRun(messages)

export const createAgentLoopStrategy = (maxTurns: number): AgentLoopStrategy =>
  combineStrategies([maxIterations(maxTurns), stopAfterRenderBlocks])
