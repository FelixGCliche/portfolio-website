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

// Seam for a future natural-language router: maps free-form input to a topic
export const resolveInput = (text: string): TopicKey | undefined => {
  const key = normalizeInput(text)
  return key && isTopicKey(key) ? key : undefined
}

export const keyToParam = (key: TopicKey): string => key.slice(1)

export const paramToKey = (param: string): TopicKey | undefined => {
  const key = `/${param}`
  return isTopicKey(key) ? key : undefined
}
