import { TOPIC_KEYS } from '@features/topic-keys'
import type { TopicKey } from '@features/topic-keys'

// Topic identity (TOPIC_KEYS) is static: route guards and other non-reactive callers need it synchronously.
// The human text (meta, desc) is locale-dependent and read through useTopics()/useTopic().
export type Topic = {
  key: TopicKey
  meta: string
  desc: string
}

// A topic joined with its command content: the short description and lowercased search keywords
export type TopicEntry = Topic & {
  short?: string
  keywords: string[]
}

// Lowercased whitespace-separated search keywords
export const splitKeywords = (text: string): string[] =>
  text.toLowerCase().split(/\s+/).filter(Boolean)

export const isTopicKey = (value: string): value is TopicKey =>
  (TOPIC_KEYS as readonly string[]).includes(value)

// Typed input as a command name: trimmed, lowercased, with a leading '/'; undefined when blank
export const normalizeInput = (text: string): string | undefined => {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return undefined
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

// What submitted composer input means: a known command, an unknown '/command', or a question for the agent
export type ResolvedInput<C> =
  | { kind: 'empty' }
  | { kind: 'command'; command: C; raw: string }
  | { kind: 'unknown'; raw: string }
  | { kind: 'ask'; raw: string }

// Known commands win (bare names like 'about' included); other '/'-prefixed input is an unknown command;
// any remaining free text goes to the agent
export const resolveInput = <C>(
  text: string,
  find: (input: string) => C | undefined
): ResolvedInput<C> => {
  const raw = text.trim()
  if (!raw) return { kind: 'empty' }
  const command = find(raw)
  if (command !== undefined) return { kind: 'command', command, raw }
  return raw.startsWith('/') ? { kind: 'unknown', raw } : { kind: 'ask', raw }
}

export const keyToParam = (key: TopicKey): string => key.slice(1)

export const paramToKey = (param: string): TopicKey | undefined => {
  const key = `/${param}`
  return isTopicKey(key) ? key : undefined
}
