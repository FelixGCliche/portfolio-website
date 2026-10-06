import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useSidebar } from '@components'
import { useCommandEntries, useComposer } from '@features/composer'
import { useConversation } from '@features/conversation'
import { LOCALES, stringsFor, translate, useI18n } from '@features/i18n'
import type { UiKey } from '@features/i18n'
import { usePreferences } from '@features/preferences'
import { EMAIL, GITHUB_URL } from '@features/profile'
import { keyToParam, useTopics } from '@features/topics'

export type CommandGroup = 'topics' | 'actions' | 'links'

export type CommandItem = {
  id: string
  group: CommandGroup
  label: string
  hint?: string
  keywords: string[]
  run: () => void
}

export const COMMAND_GROUPS: CommandGroup[] = ['topics', 'actions', 'links']

export const COMMAND_GROUP_LABELS: Record<CommandGroup, UiKey> = {
  topics: 'palette.group.topics',
  actions: 'palette.group.actions',
  links: 'palette.group.links',
}

const splitWords = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean)

// The key's text in every locale, so search matches either language whatever the active one
const allLocales = (key: UiKey) => LOCALES.map((locale) => translate(stringsFor(locale), key))

const keywordsFor = (key: UiKey) => allLocales(key).flatMap(splitWords)

// A translated string, or a literal that reads the same in every locale (brand names, codes)
type Text = UiKey | { literal: string }

const textIn = (text: Text, t: (key: UiKey) => string) =>
  typeof text === 'string' ? t(text) : text.literal

const textInAllLocales = (text: Text) =>
  typeof text === 'string' ? allLocales(text) : [text.literal]

type ActionDef = {
  id: string
  label: UiKey
  hint: Text
  keywords: UiKey
  // Composer command sharing this action; its (bilingual) content keywords join the search
  command?: string
  run: () => void
}

type LinkDef = {
  id: string
  label: Text
  hint: string
  href: string
  keywords: UiKey
}

const LINKS: LinkDef[] = [
  {
    id: 'github',
    label: { literal: 'GitHub' },
    hint: GITHUB_URL.replace(/^https?:\/\//, ''),
    href: GITHUB_URL,
    keywords: 'palette.keywords.github',
  },
  {
    id: 'email',
    label: 'palette.link.email',
    hint: EMAIL,
    href: `mailto:${EMAIL}`,
    keywords: 'palette.keywords.email',
  },
]

const openLink = (href: string) => {
  if (href.startsWith('mailto:')) window.location.href = href
  else window.open(href, '_blank', 'noopener,noreferrer')
}

export const filterCommands = (items: CommandItem[], query: string) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return items
  return items.filter((item) =>
    [item.label, item.hint ?? '', ...item.keywords].some((text) =>
      text.toLowerCase().includes(normalized)
    )
  )
}

export const useCommands = (): Accessor<CommandItem[]> => {
  const i18n = useI18n()
  const conversation = useConversation()
  const sidebar = useSidebar()
  const composer = useComposer()
  const preferences = usePreferences()
  const topics = useTopics()
  const entries = useCommandEntries()

  const actions: ActionDef[] = [
    {
      id: 'action-toggle-sidebar',
      label: 'palette.action.toggleSidebar',
      hint: 'palette.action.toggleSidebarHint',
      keywords: 'palette.keywords.toggleSidebar',
      run: sidebar.toggleSidebar,
    },
    {
      id: 'action-focus-prompt',
      label: 'palette.action.focusPrompt',
      hint: 'palette.action.focusPromptHint',
      keywords: 'palette.keywords.focusPrompt',
      run: composer.focus,
    },
    {
      id: 'action-clear-prompt',
      label: 'palette.action.clearPrompt',
      hint: 'palette.action.clearPromptHint',
      keywords: 'palette.keywords.clearPrompt',
      run: () => {
        composer.clear()
        composer.focus()
      },
    },
    {
      id: 'action-clear-conversation',
      label: 'palette.action.clearConversation',
      hint: 'palette.action.clearConversationHint',
      keywords: 'palette.keywords.clearConversation',
      command: '/clear',
      run: () => {
        conversation.clear()
        composer.focus()
      },
    },
    {
      id: 'action-toggle-language',
      label: 'palette.action.toggleLanguage',
      hint: { literal: 'en / fr' },
      keywords: 'palette.keywords.toggleLanguage',
      command: '/lang',
      run: preferences.toggleLang,
    },
    {
      id: 'action-toggle-theme',
      label: 'palette.action.toggleTheme',
      hint: 'palette.action.toggleThemeHint',
      keywords: 'palette.keywords.toggleTheme',
      command: '/theme',
      run: preferences.toggleTheme,
    },
  ]

  return createMemo(
    () => {
      const t = i18n.t
      const commandKeywords = new Map(
        entries().map((entry) => [entry.name, [entry.short, ...splitWords(entry.keywords)]])
      )
      const contentKeywords = (name?: string) => (name ? (commandKeywords.get(name) ?? []) : [])

      const topicItems = topics().map<CommandItem>((topic) => ({
        id: `topic-${keyToParam(topic.key)}`,
        group: 'topics',
        label: topic.key,
        hint: topic.desc,
        keywords: [
          ...keywordsFor('palette.keywords.topic'),
          topic.meta,
          ...contentKeywords(topic.key),
        ],
        run: () => {
          void conversation.run(topic.key)
          composer.focus()
        },
      }))

      const actionItems = actions.map<CommandItem>((action) => ({
        id: action.id,
        group: 'actions',
        label: t(action.label),
        hint: textIn(action.hint, t),
        keywords: [
          ...allLocales(action.label),
          ...textInAllLocales(action.hint),
          ...keywordsFor(action.keywords),
          ...contentKeywords(action.command),
        ],
        run: action.run,
      }))

      const linkItems = LINKS.map<CommandItem>((link) => ({
        id: `link-${link.id}`,
        group: 'links',
        label: textIn(link.label, t),
        hint: link.hint,
        keywords: [...textInAllLocales(link.label), ...keywordsFor(link.keywords)],
        run: () => openLink(link.href),
      }))

      return [...topicItems, ...actionItems, ...linkItems]
    },
    { name: 'commandPaletteItems' }
  )
}
