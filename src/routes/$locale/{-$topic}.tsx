import { createFileRoute, notFound, useNavigate } from '@tanstack/solid-router'
import { createEffect, untrack } from 'solid-js'

import { Thread, useConversation, useTopicUrl } from '@features/conversation'
import { isLocale } from '@features/i18n'
import { isTopicParam, keyToParam } from '@features/topics'

const TopicThread = () => {
  const params = Route.useParams()
  const navigate = useNavigate()
  const conversation = useConversation()
  const { syncUrl } = useTopicUrl(() => params().topic, navigate)

  let isFirstRun = true

  createEffect(
    () => conversation.state.active,
    (active, prev) => {
      if (isFirstRun) {
        isFirstRun = false
        return
      }
      if (active === prev) return
      const current = untrack(() => params().topic)
      if ((active ? keyToParam(active) : undefined) === current) return
      syncUrl(active)
    },
    { name: 'topicUrlSync' }
  )

  return <Thread />
}

export const Route = createFileRoute('/$locale/{-$topic}')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) throw notFound()
    if (params.topic !== undefined && !isTopicParam(params.topic)) throw notFound()
  },
  component: TopicThread,
})
