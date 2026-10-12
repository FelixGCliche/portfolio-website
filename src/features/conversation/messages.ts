import type { TopicKey } from '@features/topic-keys'

/**
 * Lifecycle of a streamed agent reply: `pending` until the first text arrives, `streaming` while
 * text arrives, then `done` or `error`.
 */
export type AgentReplyStatus = 'pending' | 'streaming' | 'done' | 'error'

/** A free-text agent reply: its streamed text parts and where the stream is at. */
export type AgentReply = {
  parts: string[]
  status: AgentReplyStatus
}

export type UserMessage = { id: string; role: 'user'; text: string }

/** A static topic response, rendered by its topic component. */
export type AgentTopicMessage = { id: string; role: 'agent'; kind: 'topic'; topic: TopicKey }

/** A streamed free-text response from the LLM agent. */
export type AgentTextMessage = { id: string; role: 'agent'; kind: 'text' } & AgentReply

export type AgentMessage = AgentTopicMessage | AgentTextMessage

export type Message = UserMessage | AgentMessage
