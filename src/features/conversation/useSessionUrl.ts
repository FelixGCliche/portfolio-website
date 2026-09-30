import { createEffect, untrack } from 'solid-js'
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

  const syncUrl = (key: SessionKey | '') => {
    // navigate reads router state; untracked so callers inside effect callbacks don't subscribe to it
    untrack(
      () =>
        void navigate({
          to: '/{-$session}',
          params: { session: key ? key.slice(1) : undefined },
          replace: true,
        })
    )
  }

  createEffect(
    () => session(),
    (param) => {
      if (param) void conversation.run(param, { silent: true, onError: () => syncUrl('') })
    },
    { name: 'sessionUrlToConversation' }
  )

  return { syncUrl }
}
