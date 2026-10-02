import { SESSION_KEYS } from './session-keys'
import type { SessionKey } from './session-keys'

export { SESSION_KEYS }
export type { SessionKey }

// Session identity (SESSION_KEYS) is static: route guards and other non-reactive callers need it synchronously.
// The human text (meta, desc) is locale-dependent and read through useSessions()/useSession().
export type Session = {
  key: SessionKey
  slug: string
  meta: string
  desc: string
}

export const isSessionKey = (value: string): value is SessionKey =>
  (SESSION_KEYS as readonly string[]).includes(value)

export const findSessionKey = (input: string): SessionKey | undefined => {
  const normalized = input.trim().toLowerCase()
  if (!normalized) return undefined
  const key = normalized.startsWith('/') ? normalized : `/${normalized}`
  return isSessionKey(key) ? key : undefined
}

export const keyToParam = (key: SessionKey): string => key.slice(1)

const SESSION_PARAMS: ReadonlySet<string> = new Set(SESSION_KEYS.map(keyToParam))

export const isSessionParam = (value: string): boolean => SESSION_PARAMS.has(value)
