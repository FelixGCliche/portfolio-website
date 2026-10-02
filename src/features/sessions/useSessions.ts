import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useI18n } from '@features/i18n'

import { isSessionKey } from './sessions'
import type { Session, SessionKey } from './sessions'

// Locale-aware sessions, in content order
export const useSessions = (): Accessor<Session[]> => {
  const i18n = useI18n()
  return createMemo(
    () =>
      i18n
        .sessions()
        .flatMap(({ key, slug, meta, desc }) =>
          isSessionKey(key) ? [{ key, slug, meta, desc }] : []
        ),
    { name: 'sessions' }
  )
}

export const useSession = (key: Accessor<SessionKey>): Accessor<Session> => {
  const sessions = useSessions()
  return createMemo(
    () => {
      const session = sessions().find((entry) => entry.key === key())
      if (!session) throw new Error(`Missing session content for ${key()}`)
      return session
    },
    { name: 'session' }
  )
}
