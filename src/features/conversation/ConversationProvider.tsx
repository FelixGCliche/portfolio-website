import { createContext, createStore, useContext } from 'solid-js'
import type { ParentProps } from 'solid-js'

import { resolveInput } from '@features/topics'
import type { TopicKey } from '@features/topics'

export type Message =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'agent'; topic: TopicKey }

type ConversationState = {
  messages: Message[]
  active: TopicKey | ''
}

type RunOptions = { silent?: boolean; onError?: () => void }

export type ConversationContextValue = {
  state: ConversationState
  run: (input: string, options?: RunOptions) => boolean
  clearActive: () => void
  clear: () => void
}

export const ConversationContext = createContext<ConversationContextValue>()

export const useConversation = () => useContext(ConversationContext)

export const ConversationProvider = (props: ParentProps) => {
  const [state, setState] = createStore<ConversationState>(
    { messages: [], active: '' },
    { name: 'conversation' }
  )
  let nextId = 0
  const createId = () => `m${nextId++}`

  const run = (input: string, options?: RunOptions): boolean => {
    const raw = input.trim()
    const key = resolveInput(raw)
    if (!key) {
      options?.onError?.()
      return false
    }

    if (options?.silent && state.active === key) return true

    const reply: Message = { id: createId(), role: 'agent', topic: key }
    const echo: Message[] = options?.silent ? [] : [{ id: createId(), role: 'user', text: raw }]

    setState((draft) => {
      draft.messages.push(...echo, reply)
      draft.active = key
    })

    return true
  }

  const clearActive = () => {
    if (!state.active) return
    setState((draft) => {
      draft.active = ''
    })
  }

  const clear = () => {
    setState((draft) => {
      draft.messages = []
      draft.active = ''
    })
  }

  const value: ConversationContextValue = { state, run, clearActive, clear }

  return <ConversationContext value={value}>{props.children}</ConversationContext>
}
