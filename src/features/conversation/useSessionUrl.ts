import { createEffect, untrack } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useI18n } from '@features/i18n'
import type { Locale } from '@features/i18n'
import { keyToParam } from '@features/sessions'
import type { SessionKey } from '@features/sessions'

import { useConversation } from './ConversationProvider'

type SessionNavigate = (options: {
  to: '/$locale/{-$session}'
  params: { locale: Locale; session?: string }
  replace: boolean
}) => unknown

export const useSessionUrl = (session: Accessor<string | undefined>, navigate: SessionNavigate) => {
  const conversation = useConversation()
  const i18n = useI18n()

  const syncUrl = (key: SessionKey | '') => {
    untrack(
      () =>
        void navigate({
          to: '/$locale/{-$session}',
          params: { locale: i18n.locale(), session: key ? keyToParam(key) : undefined },
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
