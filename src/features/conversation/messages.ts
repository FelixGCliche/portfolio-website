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

/** Whether two blocks are the same, by value. */
export const blockEqual = (a: Block, b: Block): boolean => JSON.stringify(a) === JSON.stringify(b)

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

export type UserMessage = { id: string; role: 'user'; text: string }

/** A static topic response, rendered by its topic component. */
export type AgentTopicMessage = { id: string; role: 'agent'; kind: 'topic'; topic: TopicKey }

/** A streamed free-text response from the LLM agent. */
export type AgentTextMessage = { id: string; role: 'agent'; kind: 'text' } & AgentReply

export type AgentMessage = AgentTopicMessage | AgentTextMessage

export type Message = UserMessage | AgentMessage
