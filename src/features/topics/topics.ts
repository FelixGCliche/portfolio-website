import { TOPIC_KEYS } from './topic-keys'
import type { TopicKey } from './topic-keys'

export { TOPIC_KEYS }
export type { TopicKey }

// Topic identity (TOPIC_KEYS) is static: route guards and other non-reactive callers need it synchronously.
// The human text (meta, desc) is locale-dependent and read through useTopics()/useTopic().
export type Topic = {
  key: TopicKey
  slug: string
  meta: string
  desc: string
}

export const isTopicKey = (value: string): value is TopicKey =>
  (TOPIC_KEYS as readonly string[]).includes(value)

export const findTopicKey = (input: string): TopicKey | undefined => {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return undefined
  const key = normalized.startsWith('/') ? normalized : `/${normalized}`
  return isTopicKey(key) ? key : undefined
}

export const keyToParam = (key: TopicKey): string => key.slice(1)

const TOPIC_PARAMS: ReadonlySet<string> = new Set(TOPIC_KEYS.map(keyToParam))

export const isTopicParam = (value: string): boolean => TOPIC_PARAMS.has(value)
