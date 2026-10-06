import { createEffect, untrack } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useI18n } from '@features/i18n'
import type { Locale } from '@features/i18n'
import { keyToParam } from '@features/topics'
import type { TopicKey } from '@features/topics'

import { useConversation } from './ConversationProvider'

type TopicNavigate = (options: {
  to: '/$locale/{-$topic}'
  params: { locale: Locale; topic?: string }
  replace: boolean
}) => unknown

export const useTopicUrl = (topic: Accessor<string | undefined>, navigate: TopicNavigate) => {
  const conversation = useConversation()
  const i18n = useI18n()

  const syncUrl = (key: TopicKey | '') => {
    untrack(
      () =>
        void navigate({
          to: '/$locale/{-$topic}',
          params: { locale: i18n.locale(), topic: key ? keyToParam(key) : undefined },
          replace: true,
        })
    )
  }

  createEffect(
    () => topic(),
    (param) => {
      if (param) {
        conversation.run(param, { silent: true, onError: () => syncUrl('') })
        return
      }
      conversation.clearActive()
    },
    { name: 'topicUrlToConversation' }
  )

  return { syncUrl }
}
