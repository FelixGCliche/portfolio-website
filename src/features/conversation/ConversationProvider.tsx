import { createContext, createStore, useContext } from 'solid-js'
import type { ParentProps } from 'solid-js'

import { findCommand } from '@features/composer'
import type { Command } from '@features/composer'
import type { SessionKey } from '@features/sessions'

export type Role = 'user' | 'agent'

export type Message = {
  id: string
  role: Role
  text?: string
  session?: SessionKey
}

export type RunOptions = {
  /** Skip echoing the raw input as a user message (e.g. restoring from the URL) */
  silent?: boolean
}

export type RunResult = {
  /** Resolved command, or undefined when the input matches nothing */
  command: Command | undefined
  /** True when the conversation consumed the command (session commands only) */
  handled: boolean
}

export type ConversationState = {
  messages: Message[]
  active: SessionKey | ''
}

export type ConversationContextValue = {
  state: ConversationState
  run: (input: string, options?: RunOptions) => RunResult
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

  const run = (input: string, options?: RunOptions): RunResult => {
    const raw = input.trim()
    const command = findCommand(raw)
    if (command?.kind !== 'session') return { command, handled: false }

    const reply: Message = { id: createId(), role: 'agent', session: command.key }
    const echo: Message[] = options?.silent ? [] : [{ id: createId(), role: 'user', text: raw }]

    setState((draft) => {
      draft.messages.push(...echo, reply)
      draft.active = command.key
    })

    return { command, handled: true }
  }

  const value: ConversationContextValue = { state, run }

  return <ConversationContext value={value}>{props.children}</ConversationContext>
}
