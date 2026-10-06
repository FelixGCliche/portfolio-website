import { useNavigate } from '@tanstack/solid-router'
import { createContext, createStore, untrack, useContext } from 'solid-js'
import type { ParentProps } from 'solid-js'

import { useI18n } from '@features/i18n'
import { topicRoute } from '@features/topics'
import type { TopicKey } from '@features/topics'

export type Message =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'agent'; topic: TopicKey }

type ConversationState = {
  messages: Message[]
}

export type ConversationContextValue = {
  state: ConversationState
  // Echoes the user's text (when given), replies with the topic and moves the URL to it
  run: (key: TopicKey, echo?: string) => void
  // Appends only the agent reply; used when the URL changes to a topic without user input
  reply: (key: TopicKey) => void
  // Empties the conversation and returns to the bare locale URL
  clear: () => void
}

export const ConversationContext = createContext<ConversationContextValue>()

export const useConversation = () => useContext(ConversationContext)

// Must be mounted inside the router and I18nProvider: the URL is the source of truth for the current topic.
export const ConversationProvider = (props: ParentProps) => {
  const navigate = useNavigate()
  const i18n = useI18n()
  const [state, setState] = createStore<ConversationState>(
    { messages: [] },
    { name: 'conversation' }
  )
  let nextId = 0
  const createId = () => `m${nextId++}`

  const goTo = (key?: TopicKey) => {
    void navigate({
      ...topicRoute(
        untrack(() => i18n.locale()),
        key
      ),
      replace: true,
    })
  }

  const reply = (key: TopicKey) => {
    setState((draft) => {
      draft.messages.push({ id: createId(), role: 'agent', topic: key })
    })
  }

  const run = (key: TopicKey, echo?: string) => {
    setState((draft) => {
      if (echo !== undefined) draft.messages.push({ id: createId(), role: 'user', text: echo })
      draft.messages.push({ id: createId(), role: 'agent', topic: key })
    })
    goTo(key)
  }

  const clear = () => {
    setState((draft) => {
      draft.messages = []
    })
    goTo()
  }

  const value: ConversationContextValue = { state, run, reply, clear }

  return <ConversationContext value={value}>{props.children}</ConversationContext>
}
