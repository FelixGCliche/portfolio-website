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
      conversation.clearActive()
    },
    { name: 'sessionUrlToConversation' }
  )

  return { syncUrl }
}
