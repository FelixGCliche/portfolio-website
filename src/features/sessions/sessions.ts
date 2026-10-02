import { sessions as contentSessions } from '@content'

import { DEFAULT_LOCALE } from '@features/i18n'

// Session identity is static: route guards and other non-reactive callers need it synchronously.
// The human text (meta, desc) is locale-dependent and read through useSessions()/useSession().
export const SESSION_KEYS = ['/about', '/work', '/skills', '/resume', '/contact'] as const

export type SessionKey = (typeof SESSION_KEYS)[number]

export type Session = {
  key: SessionKey
  slug: string
  meta: string
  desc: string
}

export const isSessionKey = (value: string): value is SessionKey =>
  (SESSION_KEYS as readonly string[]).includes(value)

// Keep SESSION_KEYS in lockstep with the content collection (the parity check covers other locales)
const contentKeys = contentSessions
  .filter((session) => session.locale === DEFAULT_LOCALE)
  .map((session) => session.key)
const missingInContent = SESSION_KEYS.filter((key) => !contentKeys.includes(key))
const unknownInContent = contentKeys.filter((key) => !isSessionKey(key))
if (missingInContent.length > 0 || unknownInContent.length > 0)
  throw new Error(
    `Session keys out of sync with content: missing [${missingInContent.join(', ')}], unknown [${unknownInContent.join(', ')}]`
  )

export const findSessionKey = (input: string): SessionKey | undefined => {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return undefined
  const key = normalized.startsWith('/') ? normalized : `/${normalized}`
  return isSessionKey(key) ? key : undefined
}

export const keyToParam = (key: SessionKey): string => key.slice(1)

const SESSION_PARAMS: ReadonlySet<string> = new Set(SESSION_KEYS.map(keyToParam))

export const isSessionParam = (value: string): boolean => SESSION_PARAMS.has(value)
