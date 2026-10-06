import { TOPIC_KEYS } from './topic-keys'
import type { TopicKey } from './topic-keys'

// Topic identity (TOPIC_KEYS) is static: route guards and other non-reactive callers need it synchronously.
// The human text (meta, desc) is locale-dependent and read through useTopics()/useTopic().
export type Topic = {
  key: TopicKey
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

export const paramToKey = (param: string): TopicKey | undefined => {
  const key = `/${param}`
  return isTopicKey(key) ? key : undefined
}
