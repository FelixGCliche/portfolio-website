import { sessions } from '@features/sessions'
import type { Session, SessionKey } from '@features/sessions'

export type Command =
  | ({ kind: 'session' } & Session)
  | { kind: 'theme'; key: '/theme'; meta: string; desc: string }
  | { kind: 'lang'; key: '/lang'; meta: string; desc: string }

export type CommandKey = SessionKey | '/theme' | '/lang'

const ACTION_COMMANDS: Command[] = [
  { kind: 'theme', key: '/theme', meta: 'toggle', desc: 'Switch color theme (dark/light)' },
  { kind: 'lang', key: '/lang', meta: 'toggle', desc: 'Switch site language (en/fr)' },
]

const commands: Command[] = [
  ...sessions.map((session): Command => ({ kind: 'session', ...session })),
  ...ACTION_COMMANDS,
]

export const matchCommands = (query: string): Command[] => {
  const normalized = query.toLowerCase()
  if (!normalized) return []
  return commands.filter((command) => command.key.startsWith(normalized))
}

export const findCommand = (input: string): Command | undefined => {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return undefined
  const key = normalized.startsWith('/') ? normalized : `/${normalized}`
  return commands.find((command) => command.key === key)
}
