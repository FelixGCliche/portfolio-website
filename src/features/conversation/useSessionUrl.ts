import { onSettled, untrack } from 'solid-js'
import type { Accessor } from 'solid-js'

import type { SessionKey } from '@features/sessions'

import { useConversation } from './ConversationProvider'

// Structural shape of the router navigate call; the `/{-$session}` route is registered in a later layer
export type SessionNavigate = (options: {
  to: '/{-$session}'
  params: { session?: string }
  replace: boolean
}) => unknown

export const useSessionUrl = (session: Accessor<string | undefined>, navigate: SessionNavigate) => {
  const conversation = useConversation()

  // Restore once from the deep link; later URL changes are driven by the conversation itself
  onSettled(() => {
    const initial = untrack(session)
    if (initial) conversation.run(initial, { silent: true })
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
