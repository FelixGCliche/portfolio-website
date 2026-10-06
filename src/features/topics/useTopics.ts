import { topics as topicContent } from '@content'
import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { pickSorted, useI18n } from '@features/i18n'

import { isTopicKey } from './topics'
import type { Topic, TopicKey } from './topics'

// Locale-aware topics, in content order
export const useTopics = (): Accessor<Topic[]> => {
  const i18n = useI18n()
  return createMemo(
    () =>
      pickSorted(topicContent, i18n.locale()).flatMap(({ key, slug, meta, desc }) =>
        isTopicKey(key) ? [{ key, slug, meta, desc }] : []
      ),
    { name: 'topics' }
  )
}

export const useTopic = (key: Accessor<TopicKey>): Accessor<Topic> => {
  const topics = useTopics()
  return createMemo(
    () => {
      const topic = topics().find((entry) => entry.key === key())
      if (!topic) throw new Error(`Missing topic content for ${key()}`)
      return topic
    },
    { name: 'topic' }
  )
}
