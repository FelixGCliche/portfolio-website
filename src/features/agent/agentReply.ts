import type { UIMessage } from '@tanstack/ai-client'

import type { AgentReply } from '@features/conversation'

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

/** The visible text of assistant messages, one entry per non-blank text part. */
export const replyParts = (messages: readonly UIMessage[]): string[] =>
  messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => message.parts)
    .flatMap((part) => (part.type === 'text' && part.content.trim() ? [part.content.trim()] : []))

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
