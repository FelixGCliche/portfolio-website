import type { Session, SessionKey } from '@features/sessions'

export type Command =
  | ({ kind: 'session' } & Session)
  | { kind: 'theme'; key: '/theme'; meta: string; desc: string }
  | { kind: 'lang'; key: '/lang'; meta: string; desc: string }
  | { kind: 'clear'; key: '/clear'; meta: string; desc: string }

export type CommandKey = SessionKey | '/theme' | '/lang' | '/clear'

const ACTION_COMMANDS: Command[] = [
  { kind: 'theme', key: '/theme', meta: 'toggle', desc: 'Switch color theme (dark/light)' },
  { kind: 'lang', key: '/lang', meta: 'toggle', desc: 'Switch site language (en/fr)' },
  { kind: 'clear', key: '/clear', meta: 'reset', desc: 'Clear the conversation' },
]

const toCommands = (sessions: Session[]): Command[] => [
  ...sessions.map((session): Command => ({ kind: 'session', ...session })),
  ...ACTION_COMMANDS,
]

// `sessions` is the locale-aware list from useSessions()
export const matchCommands = (query: string, sessions: Session[]): Command[] => {
  const normalized = query.toLowerCase()
  if (!normalized) return []
  return toCommands(sessions).filter((command) => command.key.startsWith(normalized))
}

export const findCommand = (input: string, sessions: Session[]): Command | undefined => {
  const normalized = input.trim().toLowerCase()
  const key = normalized.startsWith('/') ? normalized : `/${normalized}`
  return toCommands(sessions).find((command) => command.key === key)
}
