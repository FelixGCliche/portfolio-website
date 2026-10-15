import { useNavigate } from '@tanstack/solid-router'
import { createContext, createMemo, createStore, untrack, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import { useI18n } from '@features/i18n'
import { topicRoute } from '@features/topics'
import type { TopicKey } from '@features/topics'

import { type AgentReply, blockEqual, type Message, replyPartEqual } from './messages'

type ConversationState = {
  messages: Message[]
}

export type RunOptions = {
  // Echo the topic as user input first (default). Off when the agent, not the visitor, opens it.
  echo?: boolean
}

export type ConversationContextValue = {
  state: ConversationState
  // True once the thread has at least one message
  hasMessages: Accessor<boolean>
  // Echoes the topic as user input, replies with it and moves the URL to it
  run: (key: TopicKey, options?: RunOptions) => void
  // Echoes free text as user input and adds a pending agent reply; returns the reply's message id
  ask: (text: string) => string
  // Replaces the streamed parts and status of the agent reply with this id
  updateReply: (id: string, reply: AgentReply) => void
  // Called when the URL's topic changes: replies unless run() already answered that navigation
  syncUrl: (key?: TopicKey) => void
  // Empties the conversation and returns to the bare locale URL
  clear: () => void
  // Registers a listener called whenever the conversation is cleared; returns its unsubscribe
  onClear: (listener: () => void) => () => void
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
  const clearListeners = new Set<() => void>()

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

  const run = (key: TopicKey, options?: RunOptions) => {
    const echo = options?.echo ?? true
    setState((draft) => {
      if (echo) draft.messages.push({ id: createId(), role: 'user', text: key })
      draft.messages.push({ id: createId(), role: 'agent', kind: 'topic', topic: key })
    })
    if (key !== head) answered.add(key)
    head = key
    goTo(key)
  }

  const ask = (text: string) => {
    const userId = createId()
    const id = createId()
    setState((draft) => {
      draft.messages.push(
        { id: userId, role: 'user', text },
        { id, role: 'agent', kind: 'text', parts: [], status: 'pending' }
      )
    })
    return id
  }

  // Streaming rewrites the reply on every chunk: only parts (and blocks) that changed are written,
  // index by index, so rendered parts update in place instead of remounting and re-animating.
  // Each chunk only compares what can have changed, so a long stream stays linear.
  const updateReply = (id: string, reply: AgentReply) => {
    setState((draft) => {
      const message = draft.messages.find((item) => item.id === id)
      if (message?.role !== 'agent' || message.kind !== 'text') return
      const parts = message.parts
      reply.parts.forEach((next, i) => {
        const current = parts[i]
        // The same render_blocks call: a complete call's arguments are final, and while it
        // streams only finished blocks are shown, so just the blocks past the shown ones are new.
        if (current?.kind === 'blocks' && next.kind === 'blocks' && current.id === next.id) {
          if (current.complete && next.complete) return
          const from = !current.complete && !next.complete ? current.blocks.length : 0
          for (let j = from; j < next.blocks.length; j++) {
            const block = next.blocks[j]
            if (!current.blocks[j] || !blockEqual(current.blocks[j], block))
              current.blocks[j] = block
          }
          if (current.blocks.length > next.blocks.length) current.blocks.splice(next.blocks.length)
          if (current.complete !== next.complete) current.complete = next.complete
          return
        }
        if (current && replyPartEqual(current, next)) return
        // The same text part streaming in: it only ever grows, so anything else at this index is
        // a different part and is replaced rather than rewritten in place.
        if (
          current?.kind === 'text' &&
          next.kind === 'text' &&
          next.text.startsWith(current.text)
        ) {
          current.text = next.text
          return
        }
        parts[i] = next
      })
      if (parts.length > reply.parts.length) parts.splice(reply.parts.length)
      if (message.status !== reply.status) message.status = reply.status
    })
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
      draft.messages.push({ id: createId(), role: 'agent', kind: 'topic', topic: key })
    })
  }

  const clear = () => {
    setState((draft) => {
      draft.messages = []
    })
    answered.clear()
    head = undefined
    // A failing listener must not leave the URL on the cleared topic.
    try {
      for (const listener of clearListeners) listener()
    } finally {
      goTo()
    }
  }

  const onClear = (listener: () => void) => {
    clearListeners.add(listener)
    return () => {
      clearListeners.delete(listener)
    }
  }

  const value: ConversationContextValue = {
    state,
    hasMessages,
    run,
    ask,
    updateReply,
    syncUrl,
    clear,
    onClear,
  }

  return <ConversationContext value={value}>{props.children}</ConversationContext>
}
