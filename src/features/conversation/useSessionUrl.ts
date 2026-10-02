import { createEffect, untrack } from 'solid-js'
import type { Accessor } from 'solid-js'

import { keyToParam } from '@features/sessions'
import type { SessionKey } from '@features/sessions'

import { useConversation } from './ConversationProvider'

type SessionNavigate = (options: {
  to: '/{-$session}'
  params: { session?: string }
  replace: boolean
}) => unknown

export const useSessionUrl = (session: Accessor<string | undefined>, navigate: SessionNavigate) => {
  const conversation = useConversation()

  const syncUrl = (key: SessionKey | '') => {
    // navigate reads router state; untracked so callers inside effect callbacks don't subscribe to it
    untrack(
      () =>
        void navigate({
          to: '/{-$session}',
          params: { session: key ? keyToParam(key) : undefined },
          replace: true,
        })
    )
  }

  createEffect(
    () => session(),
    (param) => {
      if (param) {
        conversation.run(param, { silent: true, onError: () => syncUrl('') })
        return
      }
      // URL left the session (back button, link to `/`): keep `active` in sync. A no-op on the initial `/` load;
      // the resulting active '' already matches the empty param, so the route's sync effect won't navigate back
      conversation.clearActive()
    },
    { name: 'sessionUrlToConversation' }
  )

  return { syncUrl }
}
