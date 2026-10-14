import { type AgentLoopStrategy, combineStrategies, maxIterations } from '@tanstack/ai'

import { renderBlocksTool } from '@features/agent-tools'

type LoopMessage = Parameters<AgentLoopStrategy>[0]['messages'][number]

/** True once the model has called `render_blocks` after the visitor's latest message. */
export const hasRenderedBlocksThisRun = (messages: readonly LoopMessage[]): boolean => {
  const lastUser = messages.findLastIndex((message) => message.role === 'user')
  return messages
    .slice(lastUser + 1)
    .some(
      (message) =>
        message.role === 'assistant' &&
        message.toolCalls?.some((call) => call.function.name === renderBlocksTool.name)
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
