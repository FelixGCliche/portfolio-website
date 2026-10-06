import { createFileRoute, notFound } from '@tanstack/solid-router'
import { createEffect, untrack } from 'solid-js'

import { Thread, useConversation } from '@features/conversation'
import { isLocale } from '@features/i18n'
import { paramToKey } from '@features/topics'

const TopicThread = () => {
  const params = Route.useParams()
  const conversation = useConversation()

  // The URL is the source of truth: a topic URL that run() didn't already answer gets a silent reply
  createEffect(
    () => params().topic,
    (topic) => {
      const key = topic ? paramToKey(topic) : undefined
      untrack(() => conversation.syncUrl(key))
    },
    { name: 'topicUrlToConversation' }
  )

  return <Thread />
}

export const Route = createFileRoute('/$locale/{-$topic}')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) throw notFound()
    if (params.topic !== undefined && !paramToKey(params.topic)) throw notFound()
  },
  component: TopicThread,
})
