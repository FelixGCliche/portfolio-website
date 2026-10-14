import { parsePartialJSON } from '@tanstack/ai-client'
import type { UIMessage } from '@tanstack/ai-client'

import { parseBlocksLenient } from '@features/block-schema'
import type { Block } from '@features/block-schema'
import type { AgentReply, ReplyPart } from '@features/conversation'

/** The tool whose calls are rendered inline as blocks. */
export const RENDER_BLOCKS_TOOL = 'render_blocks'

// Tool call states whose arguments are still streaming in.
const STREAMING_STATES = new Set(['awaiting-input', 'input-streaming'])

/** The chat-client state a reply's status is derived from. */
export type ReplyState = {
  isLoading: boolean
  hasError: boolean
}

/**
 * The messages answering the user message with `userMessageId`: every message after it up to the
 * next user message. `undefined` while the user message hasn't reached the chat client yet.
 */
export const turnMessages = (
  messages: readonly UIMessage[],
  userMessageId: string
): UIMessage[] | undefined => {
  const start = messages.findIndex((message) => message.id === userMessageId)
  if (start === -1 || messages[start].role !== 'user') return undefined
  const next = messages.findIndex((message, i) => i > start && message.role === 'user')
  return messages.slice(start + 1, next === -1 ? undefined : next)
}

type ToolCallPart = Extract<UIMessage['parts'][number], { type: 'tool-call' }>

/**
 * The blocks of a `render_blocks` call. While its arguments stream in, the last array element may
 * be cut off mid-value (partial JSON fills in truncated strings), so it is held back until the
 * next block starts or the call completes: only finished blocks are shown.
 */
const callBlocks = (part: ToolCallPart, complete: boolean): Block[] => {
  const args = (part.input ?? parsePartialJSON(part.arguments)) as { blocks?: unknown } | undefined
  const raw = args?.blocks
  if (!Array.isArray(raw)) return []
  return parseBlocksLenient(complete ? raw : raw.slice(0, -1))
}

/**
 * The visible parts of assistant messages, in order: one text part per non-blank text part, and
 * one blocks part per `render_blocks` call once it has at least one block. Other tool calls, tool
 * results and thinking are not shown.
 */
export const replyParts = (messages: readonly UIMessage[]): ReplyPart[] =>
  messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => message.parts)
    .flatMap((part): ReplyPart[] => {
      if (part.type === 'text') {
        const text = part.content.trim()
        return text ? [{ kind: 'text', text }] : []
      }
      if (part.type === 'tool-call' && part.name === RENDER_BLOCKS_TOOL) {
        const complete = !STREAMING_STATES.has(part.state)
        const blocks = callBlocks(part, complete)
        return blocks.length > 0 ? [{ kind: 'blocks', id: part.id, blocks, complete }] : []
      }
      return []
    })

/**
 * Maps the chat client's messages and state to the reply for one turn. Error details are never
 * surfaced: the UI shows a friendly message for the `error` status instead of upstream text.
 */
export const mapTurnReply = (
  messages: readonly UIMessage[],
  userMessageId: string,
  state: ReplyState
): AgentReply => {
  const turn = turnMessages(messages, userMessageId)
  if (!turn) return { parts: [], status: 'pending' }

  const parts = replyParts(turn)
  if (state.isLoading) return { parts, status: parts.length > 0 ? 'streaming' : 'pending' }
  if (state.hasError) return { parts, status: 'error' }
  return { parts, status: 'done' }
}
