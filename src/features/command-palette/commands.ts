import { useNavigate } from '@tanstack/solid-router'

import { useSidebar } from '@components'
import { useComposer } from '@features/composer'
import { usePreferences } from '@features/preferences'
import { EMAIL, GITHUB_URL } from '@features/profile'
import { sessions } from '@features/sessions'

export type CommandGroup = 'Sessions' | 'Actions' | 'Links'

export type CommandItem = {
  id: string
  group: CommandGroup
  label: string
  hint?: string
  keywords: string[]
  run: () => void
}

export const COMMAND_GROUPS: CommandGroup[] = ['Sessions', 'Actions', 'Links']

type ExternalLink = {
  id: string
  label: string
  hint: string
  href: string
  keywords: string[]
}

const LINKS: ExternalLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    hint: GITHUB_URL.replace(/^https?:\/\//, ''),
    href: GITHUB_URL,
    keywords: ['code', 'source', 'repositories'],
  },
  {
    id: 'email',
    label: 'Email',
    hint: EMAIL,
    href: `mailto:${EMAIL}`,
    keywords: ['mail', 'contact', 'write'],
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

export const useCommands = (): CommandItem[] => {
  const navigate = useNavigate()
  const sidebar = useSidebar()
  const composer = useComposer()
  const preferences = usePreferences()

  const sessionItems = sessions.map<CommandItem>((session) => ({
    id: `session-${session.key.slice(1)}`,
    group: 'Sessions',
    label: session.key,
    hint: session.desc,
    keywords: ['go', 'open', 'page', session.meta],
    run: () => {
      void navigate({ to: session.key })
      composer.focus()
    },
  }))

  const actionItems: CommandItem[] = [
    {
      id: 'action-toggle-sidebar',
      group: 'Actions',
      label: 'Toggle sidebar',
      hint: 'show or hide sessions',
      keywords: ['menu', 'navigation', 'drawer'],
      run: sidebar.toggleSidebar,
    },
    {
      id: 'action-focus-prompt',
      group: 'Actions',
      label: 'Focus prompt',
      hint: 'jump to the command line',
      keywords: ['input', 'command', 'type'],
      run: composer.focus,
    },
    {
      id: 'action-clear-prompt',
      group: 'Actions',
      label: 'Clear prompt',
      hint: 'empty the command line',
      keywords: ['input', 'command', 'reset'],
      run: () => {
        composer.clear()
        composer.focus()
      },
    },
    {
      id: 'action-toggle-language',
      group: 'Actions',
      label: 'Toggle language',
      hint: 'en / fr',
      keywords: ['english', 'french', 'français', 'locale'],
      run: preferences.toggleLang,
    },
    {
      id: 'action-toggle-theme',
      group: 'Actions',
      label: 'Toggle theme',
      hint: 'dark / light',
      keywords: ['mode', 'color', 'appearance'],
      run: preferences.toggleTheme,
    },
  ]

  const linkItems = LINKS.map<CommandItem>((link) => ({
    id: `link-${link.id}`,
    group: 'Links',
    label: link.label,
    hint: link.hint,
    keywords: link.keywords,
    run: () => openLink(link.href),
  }))

  return [...sessionItems, ...actionItems, ...linkItems]
}
