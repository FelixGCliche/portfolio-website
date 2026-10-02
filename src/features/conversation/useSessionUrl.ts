import { onSettled, untrack } from 'solid-js'
import type { Accessor } from 'solid-js'

import type { SessionKey } from '@features/sessions'

import { useConversation } from './ConversationProvider'

export type SessionNavigate = (options: {
  to: '/{-$session}'
  params: { session?: string }
  replace: boolean
}) => unknown

export const useSessionUrl = (session: Accessor<string | undefined>, navigate: SessionNavigate) => {
  const conversation = useConversation()

  onSettled(() => {
    const initial = untrack(session)
    if (initial) void conversation.run(initial, { silent: true })
  })

  const syncUrl = (key: SessionKey | '') => {
    void navigate({
      to: '/{-$session}',
      params: { session: key ? key.slice(1) : undefined },
      replace: true,
    })
  }

  return { syncUrl }
}
