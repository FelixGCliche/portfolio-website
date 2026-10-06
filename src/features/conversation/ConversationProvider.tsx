import { useNavigate } from '@tanstack/solid-router'
import { createContext, createMemo, createStore, untrack, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

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
  // True once the thread has at least one message
  hasMessages: Accessor<boolean>
  // Echoes the topic as user input, replies with it and moves the URL to it
  run: (key: TopicKey) => void
  // Called when the URL's topic changes: replies unless run() already answered that navigation
  syncUrl: (key?: TopicKey) => void
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
  const hasMessages = createMemo(() => state.messages.length > 0, { name: 'hasMessages' })
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

  // Topics run() already answered whose URL change hasn't landed yet, and the topic the URL is at or heading to
  const answered = new Set<TopicKey>()
  let head: TopicKey | undefined

  const run = (key: TopicKey) => {
    setState((draft) => {
      draft.messages.push(
        { id: createId(), role: 'user', text: key },
        { id: createId(), role: 'agent', topic: key }
      )
    })
    if (key !== head) answered.add(key)
    head = key
    goTo(key)
  }

  const syncUrl = (key?: TopicKey) => {
    if (!key) {
      answered.clear()
      head = undefined
      return
    }
    if (answered.delete(key)) return
    head = key
    setState((draft) => {
      draft.messages.push({ id: createId(), role: 'agent', topic: key })
    })
  }

  const clear = () => {
    setState((draft) => {
      draft.messages = []
    })
    answered.clear()
    head = undefined
    goTo()
  }

  const value: ConversationContextValue = { state, hasMessages, run, syncUrl, clear }

  return <ConversationContext value={value}>{props.children}</ConversationContext>
}
