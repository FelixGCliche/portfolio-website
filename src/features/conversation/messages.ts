import type { Block } from '@features/block-schema'
import type { TopicKey } from '@features/topic-keys'

/**
 * Lifecycle of a streamed agent reply: `pending` until the first part arrives, `streaming` while
 * parts arrive, then `done` or `error`.
 */
export type AgentReplyStatus = 'pending' | 'streaming' | 'done' | 'error'

/** A run of markdown text in a reply. */
export type ReplyTextPart = { kind: 'text'; text: string }

/**
 * The blocks of one `render_blocks` call, keyed by its tool call id. `complete` is false while the
 * call's arguments still stream in, so `blocks` holds only the blocks parsed so far.
 */
export type ReplyBlocksPart = { kind: 'blocks'; id: string; blocks: Block[]; complete: boolean }

/** One piece of a reply, in the order the agent produced it. */
export type ReplyPart = ReplyTextPart | ReplyBlocksPart

/** A free-text agent reply: its streamed parts and where the stream is at. */
export type AgentReply = {
  parts: ReplyPart[]
  status: AgentReplyStatus
}

// Structural equality of JSON values, exiting at the first difference without serializing.
const jsonEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    return a.every((item, i) => jsonEqual(item, b[i]))
  }
  if (Array.isArray(b)) return false
  const left = a as Record<string, unknown>
  const right = b as Record<string, unknown>
  const keys = Object.keys(left)
  if (keys.length !== Object.keys(right).length) return false
  return keys.every((key) => Object.hasOwn(right, key) && jsonEqual(left[key], right[key]))
}

/** Whether two blocks are the same, by value. */
export const blockEqual = (a: Block, b: Block): boolean => jsonEqual(a, b)

/** Whether two reply parts render the same, so a streaming update can skip unchanged ones. */
export const replyPartEqual = (a: ReplyPart, b: ReplyPart): boolean => {
  if (a.kind === 'text') return b.kind === 'text' && a.text === b.text
  return (
    b.kind === 'blocks' &&
    a.id === b.id &&
    a.complete === b.complete &&
    a.blocks.length === b.blocks.length &&
    a.blocks.every((block, i) => blockEqual(block, b.blocks[i]))
  )
}

/**
 * Brings `current` (a streaming call's blocks, e.g. a store draft) up to `next` in place. A
 * streaming call's blocks are append-only, so only blocks past `current`'s end are written: O(new
 * blocks) per chunk, and earlier blocks keep their identity instead of remounting. As a safety net
 * the last shared block is rewritten if it differs, and blocks `next` no longer has are removed.
 */
export const mergeStreamingBlocks = (current: Block[], next: readonly Block[]): void => {
  const shared = Math.min(current.length, next.length)
  if (shared > 0 && !blockEqual(current[shared - 1], next[shared - 1]))
    current[shared - 1] = next[shared - 1]
  if (current.length > next.length) current.splice(next.length)
  else for (let i = shared; i < next.length; i++) current.push(next[i])
}

export type UserMessage = { id: string; role: 'user'; text: string }

/** A static topic response, rendered by its topic component. */
export type AgentTopicMessage = { id: string; role: 'agent'; kind: 'topic'; topic: TopicKey }

/** A streamed free-text response from the LLM agent. */
export type AgentTextMessage = { id: string; role: 'agent'; kind: 'text' } & AgentReply

export type AgentMessage = AgentTopicMessage | AgentTextMessage

export type Message = UserMessage | AgentMessage
