import { createContext, createStore, useContext } from 'solid-js'
import type { ParentProps } from 'solid-js'

import { findSession } from '@features/sessions'
import type { SessionKey } from '@features/sessions'

export type Message =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'agent'; session: SessionKey }

type ConversationState = {
  messages: Message[]
  active: SessionKey | ''
}

type RunOptions = { silent?: boolean; onError?: () => void }

export type ConversationContextValue = {
  state: ConversationState
  // Returns whether the input named a known session
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
    const command = findSession(raw)
    if (!command) {
      options?.onError?.()
      return false
    }

    if (options?.silent && state.active === command.key) return true

    const reply: Message = { id: createId(), role: 'agent', session: command.key }
    const echo: Message[] = options?.silent ? [] : [{ id: createId(), role: 'user', text: raw }]

    setState((draft) => {
      draft.messages.push(...echo, reply)
      draft.active = command.key
    })

    return true
  }

  // Keeps the message history; only forgets the active session so the next command for it isn't a no-op
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
