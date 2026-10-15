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

type MessagePart = UIMessage['parts'][number]
type ToolCallPart = Extract<MessagePart, { type: 'tool-call' }>
type ToolResultPart = Extract<MessagePart, { type: 'tool-result' }>

// Whether a tool output reports an error instead of a result.
const isErrorOutput = (output: unknown): boolean =>
  typeof output === 'object' && output !== null && 'error' in output

// Whether a tool result's content reports an error, e.g. the server rejecting invalid arguments.
const isErrorResult = (result: ToolResultPart): boolean => {
  if (result.state === 'error' || result.error !== undefined) return true
  if (typeof result.content !== 'string') return false
  try {
    return isErrorOutput(JSON.parse(result.content))
  } catch {
    return false
  }
}

// Whether the whole call was rejected (failed validation or execution): none of its blocks show.
const isRejected = (part: ToolCallPart, results: ReadonlyMap<string, ToolResultPart>): boolean => {
  if (part.state === 'error' || isErrorOutput(part.output)) return true
  const result = results.get(part.id)
  return result !== undefined && isErrorResult(result)
}

// Whether the raw arguments are complete JSON, i.e. weren't cut off mid-stream.
const isWholeJSON = (text: string): boolean => {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

/**
 * The blocks of a `render_blocks` call. While its arguments stream in, the last array element may
 * be cut off mid-value (partial JSON fills in truncated strings), so it is held back until the
 * next block starts or the call completes: only finished blocks are shown. When the stream ended
 * with the arguments still cut off (aborted or failed), the truncated last block stays dropped.
 */
const callBlocks = (part: ToolCallPart, finished: boolean, settled: boolean): Block[] => {
  const args = (part.input ?? parsePartialJSON(part.arguments)) as { blocks?: unknown } | undefined
  const raw = args?.blocks
  if (!Array.isArray(raw)) return []
  const whole = finished || (settled && (part.input !== undefined || isWholeJSON(part.arguments)))
  return parseBlocksLenient(whole ? raw : raw.slice(0, -1))
}

/**
 * The visible parts of assistant messages, in order: one text part per non-blank text part, and
 * one blocks part per `render_blocks` call once it has at least one block. Other tool calls, tool
 * results and thinking are not shown, and neither are calls that errored or that the server
 * rejected. `settled` is true once the stream ended (done, failed or aborted): calls still
 * mid-arguments then count as complete, since no more input will arrive.
 */
export const replyParts = (messages: readonly UIMessage[], settled = false): ReplyPart[] => {
  const parts = messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => message.parts)
  const results = new Map<string, ToolResultPart>()
  for (const part of parts) if (part.type === 'tool-result') results.set(part.toolCallId, part)

  return parts.flatMap((part): ReplyPart[] => {
    if (part.type === 'text') {
      const text = part.content.trim()
      return text ? [{ kind: 'text', text }] : []
    }
    if (part.type === 'tool-call' && part.name === RENDER_BLOCKS_TOOL) {
      if (isRejected(part, results)) return []
      const finished = !STREAMING_STATES.has(part.state)
      const blocks = callBlocks(part, finished, settled)
      const complete = finished || settled
      return blocks.length > 0 ? [{ kind: 'blocks', id: part.id, blocks, complete }] : []
    }
    return []
  })
}

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

  const parts = replyParts(turn, !state.isLoading)
  if (state.isLoading) return { parts, status: parts.length > 0 ? 'streaming' : 'pending' }
  if (state.hasError) return { parts, status: 'error' }
  return { parts, status: 'done' }
}
