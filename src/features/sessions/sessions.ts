export const SESSION_KEYS = ['/about', '/work', '/skills', '/resume', '/contact'] as const

export type SessionKey = (typeof SESSION_KEYS)[number]

export type Session = {
  key: SessionKey
  meta: string
  desc: string
}

export const sessions: Session[] = [
  { key: '/about', meta: '5y', desc: 'How I got here, briefly' },
  { key: '/work', meta: '4 roles', desc: 'What I shipped, and where' },
  { key: '/skills', meta: '6 areas', desc: 'The toolbox, honestly rated' },
  { key: '/resume', meta: 'pdf', desc: 'The full CV, downloadable' },
  { key: '/contact', meta: 'open', desc: 'Same-day answer, promised' },
]

const sessionsByKey = Object.fromEntries(
  sessions.map((session) => [session.key, session])
) as Record<SessionKey, Session>

export const getSession = (key: SessionKey): Session => sessionsByKey[key]

export const findSession = (input: string): Session | undefined => {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return undefined
  const key = normalized.startsWith('/') ? normalized : `/${normalized}`
  return sessions.find((session) => session.key === key)
}

export const keyToParam = (key: SessionKey): string => key.slice(1)

const SESSION_PARAMS: ReadonlySet<string> = new Set(SESSION_KEYS.map(keyToParam))

export const isSessionParam = (value: string): boolean => SESSION_PARAMS.has(value)
