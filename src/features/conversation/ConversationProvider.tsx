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

export type RunError = {
  reason: 'unknown' | 'unhandled'
  input: string
  command: Command | undefined
}

export type RunResult = {
  command: Command | undefined
  handled: boolean
  error: RunError | undefined
}

export type RunOptions = {
  silent?: boolean
  onSuccess?: (result: RunResult) => void
  onError?: (result: RunResult) => void
  onSettled?: (result: RunResult) => void
}

export type ConversationState = {
  messages: Message[]
  active: SessionKey | ''
}

export type ConversationContextValue = {
  state: ConversationState
  run: (input: string, options?: RunOptions) => Promise<RunResult>
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

  const run = async (input: string, options?: RunOptions): Promise<RunResult> => {
    const raw = input.trim()
    const command = findCommand(raw)
    if (command?.kind !== 'session') {
      const error: RunError = { reason: command ? 'unhandled' : 'unknown', input: raw, command }
      const failed: RunResult = { command, handled: false, error }
      options?.onError?.(failed)
      options?.onSettled?.(failed)
      return failed
    }

    if (state.active === command.key) {
      const result: RunResult = { command, handled: true, error: undefined }
      options?.onSuccess?.(result)
      options?.onSettled?.(result)
      return result
    }

    const reply: Message = { id: createId(), role: 'agent', session: command.key }
    const echo: Message[] = options?.silent ? [] : [{ id: createId(), role: 'user', text: raw }]

    setState((draft) => {
      draft.messages.push(...echo, reply)
      draft.active = command.key
    })

    const result: RunResult = { command, handled: true, error: undefined }
    options?.onSuccess?.(result)
    options?.onSettled?.(result)
    return result
  }

  const value: ConversationContextValue = { state, run }

  return <ConversationContext value={value}>{props.children}</ConversationContext>
}
