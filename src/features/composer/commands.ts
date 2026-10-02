import type { Command as CommandEntry } from '@content'
import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useI18n } from '@features/i18n'
import type { UiKey } from '@features/i18n'
import { isSessionKey, useSessions } from '@features/sessions'
import type { Session, SessionKey } from '@features/sessions'

type ActionKind = 'theme' | 'lang' | 'clear'

type CommandText = { meta: string; desc: string; keywords: string[] }

export type Command =
  | ({ kind: 'session'; key: SessionKey } & CommandText)
  | ({ kind: ActionKind; key: string } & CommandText)

const ACTIONS: Record<string, { kind: ActionKind; meta: UiKey }> = {
  '/theme': { kind: 'theme', meta: 'composer.metaToggle' },
  '/lang': { kind: 'lang', meta: 'composer.metaToggle' },
  '/clear': { kind: 'clear', meta: 'composer.metaReset' },
}

const MIN_KEYWORD_QUERY = 2

const toCommand = (
  entry: CommandEntry,
  sessions: Session[],
  t: (key: UiKey) => string
): Command[] => {
  const text = {
    desc: entry.short,
    keywords: entry.keywords.toLowerCase().split(/\s+/).filter(Boolean),
  }
  if (isSessionKey(entry.name)) {
    const session = sessions.find((item) => item.key === entry.name)
    return session ? [{ kind: 'session', key: session.key, meta: session.meta, ...text }] : []
  }
  const action = ACTIONS[entry.name] as (typeof ACTIONS)[string] | undefined
  return action ? [{ kind: action.kind, key: entry.name, meta: t(action.meta), ...text }] : []
}

// Locale-aware composer commands, in content order
export const useComposerCommands = (): Accessor<Command[]> => {
  const i18n = useI18n()
  const sessions = useSessions()
  return createMemo(
    () => i18n.commands().flatMap((entry) => toCommand(entry, sessions(), i18n.t)),
    { name: 'composerCommands' }
  )
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
  const normalized = input.trim().toLowerCase()
  if (!normalized) return undefined
  const key = normalized.startsWith('/') ? normalized : `/${normalized}`
  return commands.find((command) => command.key === key)
}
