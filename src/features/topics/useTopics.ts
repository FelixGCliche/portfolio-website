import { commands as commandContent, topics as topicContent } from '@content'
import type { Accessor } from 'solid-js'

import { LOCALES, pickSorted, useI18n } from '@features/i18n'
import type { Locale } from '@features/i18n'
import type { TopicKey } from '@features/topic-keys'

import { splitKeywords } from './topics'
import type { Topic, TopicEntry } from './topics'

type LocaleTopics = { list: Topic[]; byKey: Record<TopicKey, Topic>; entries: TopicEntry[] }

// Content is static and only the locale varies, so every locale's topics are built once at module load and
// shared by all callers; the hooks below are plain lookups keyed by the reactive locale. The key cast is safe:
// velite.config.ts fails the build unless each locale's topic keys match TOPIC_KEYS exactly.
const TOPICS = Object.fromEntries(
  LOCALES.map((locale) => {
    const list = pickSorted(topicContent, locale).map(({ key, meta, desc }): Topic => ({
      key: key as TopicKey,
      meta,
      desc,
    }))
    const byKey = Object.fromEntries(list.map((topic) => [topic.key, topic])) as Record<
      TopicKey,
      Topic
    >
    const commands = pickSorted(commandContent, locale)
    const entries = list.map((topic): TopicEntry => {
      const command = commands.find((item) => item.name === topic.key)
      return command
        ? { ...topic, short: command.short, keywords: splitKeywords(command.keywords) }
        : { ...topic, keywords: [] }
    })
    return [locale, { list, byKey, entries }]
  })
) as Record<Locale, LocaleTopics>

// Locale-aware topics, in content order
export const useTopics = (): Accessor<Topic[]> => {
  const i18n = useI18n()
  return () => TOPICS[i18n.locale()].list
}

export const useTopic = (key: Accessor<TopicKey>): Accessor<Topic> => {
  const i18n = useI18n()
  return () => TOPICS[i18n.locale()].byKey[key()]
}

// Locale-aware topics joined with their command content, in topic content order
export const useTopicEntries = (): Accessor<TopicEntry[]> => {
  const i18n = useI18n()
  return () => TOPICS[i18n.locale()].entries
}
