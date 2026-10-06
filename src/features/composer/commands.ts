import type { Command as CommandEntry } from '@content'
import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useI18n } from '@features/i18n'
import type { UiKey } from '@features/i18n'
import { isTopicKey, normalizeInput, splitKeywords, useTopicEntries } from '@features/topics'
import type { TopicEntry, TopicKey } from '@features/topics'

import { useCommandEntries } from './useCommandEntries'

type ActionKind = 'theme' | 'lang' | 'clear'

type CommandText = { meta: string; desc: string; keywords: string[] }

export type Command =
  | ({ kind: 'topic'; key: TopicKey } & CommandText)
  | ({ kind: ActionKind; key: string } & CommandText)

const ACTIONS: Record<string, { kind: ActionKind; meta: UiKey }> = {
  '/theme': { kind: 'theme', meta: 'composer.metaToggle' },
  '/lang': { kind: 'lang', meta: 'composer.metaToggle' },
  '/clear': { kind: 'clear', meta: 'composer.metaReset' },
}

const MIN_KEYWORD_QUERY = 2

const toCommand = (
  entry: CommandEntry,
  topics: TopicEntry[],
  t: (key: UiKey) => string
): Command[] => {
  if (isTopicKey(entry.name)) {
    const topic = topics.find((item) => item.key === entry.name)
    return topic
      ? [
          {
            kind: 'topic',
            key: topic.key,
            meta: topic.meta,
            desc: topic.short ?? entry.short,
            keywords: topic.keywords,
          },
        ]
      : []
  }
  const action = ACTIONS[entry.name] as (typeof ACTIONS)[string] | undefined
  return action
    ? [
        {
          kind: action.kind,
          key: entry.name,
          meta: t(action.meta),
          desc: entry.short,
          keywords: splitKeywords(entry.keywords),
        },
      ]
    : []
}

// Locale-aware composer commands, in command content order (topics and actions interleaved)
export const useComposerCommands = (): Accessor<Command[]> => {
  const i18n = useI18n()
  const entries = useCommandEntries()
  const topics = useTopicEntries()
  return createMemo(() => entries().flatMap((entry) => toCommand(entry, topics(), i18n.t)), {
    name: 'composerCommands',
  })
}

// Name prefix matches first, then commands with a keyword starting with the query
export const matchCommands = (query: string, commands: Command[]): Command[] => {
  const normalized = query.toLowerCase()
  if (!normalized) return []
  const byName = commands.filter((command) => command.key.startsWith(normalized))
  const term = normalized.replace(/^\//, '')
  if (term.length < MIN_KEYWORD_QUERY) return byName
  const byKeyword = commands.filter(
    (command) =>
      !byName.includes(command) && command.keywords.some((keyword) => keyword.startsWith(term))
  )
  return [...byName, ...byKeyword]
}

export const findCommand = (input: string, commands: Command[]): Command | undefined => {
  const key = normalizeInput(input)
  return key ? commands.find((command) => command.key === key) : undefined
}
