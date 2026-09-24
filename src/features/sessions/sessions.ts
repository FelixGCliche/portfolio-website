import type { FileRoutesByTo } from '../../routeTree.gen'

export type SessionKey = Exclude<keyof FileRoutesByTo, '/'>

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

export const matchSessions = (query: string): Session[] => {
  const normalized = query.toLowerCase()
  if (!normalized) return []
  return sessions.filter((session) => session.key.startsWith(normalized))
}

export const findSession = (input: string): Session | undefined => {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return undefined
  const key = normalized.startsWith('/') ? normalized : `/${normalized}`
  return sessions.find((session) => session.key === key)
}
