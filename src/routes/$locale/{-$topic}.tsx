import { createFileRoute, notFound } from '@tanstack/solid-router'
import { createEffect, untrack } from 'solid-js'

import { Thread, useConversation } from '@features/conversation'
import type { Message } from '@features/conversation'
import { isLocale } from '@features/i18n'
import { paramToKey } from '@features/topics'

type AgentMessage = Extract<Message, { role: 'agent' }>

const lastReplyTopic = (messages: Message[]) =>
  messages.findLast((message): message is AgentMessage => message.role === 'agent')?.topic

const TopicThread = () => {
  const params = Route.useParams()
  const conversation = useConversation()

  // The URL is the source of truth: a topic URL not already answered by the latest reply gets a silent one
  createEffect(
    () => params().topic,
    (topic) => {
      const key = topic ? paramToKey(topic) : undefined
      if (!key) return
      if (untrack(() => lastReplyTopic(conversation.state.messages)) === key) return
      conversation.reply(key)
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
