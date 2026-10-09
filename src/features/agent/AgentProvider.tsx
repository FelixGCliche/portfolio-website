import { createContext, createEffect, createSignal, onSettled, untrack, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import { createClientTools } from '@features/agent-tools'
import { useConversation } from '@features/conversation'
import { useI18n } from '@features/i18n'
import { usePreferences } from '@features/preferences'

import { mapTurnReply } from './agentReply'
import { useAgentChat } from './useAgentChat'

export type AgentContextValue = {
  // Echoes free text in the thread and streams the agent's reply under it
  ask: (text: string) => void
  // Re-runs the latest question
  retry: () => void
  // Aborts the reply in flight
  stop: () => void
  isLoading: Accessor<boolean>
  hasError: Accessor<boolean>
}

export const AgentContext = createContext<AgentContextValue>()

export const useAgent = () => useContext(AgentContext)

// The latest question: the chat client's user message id and the thread message showing its reply.
type Turn = { chatId: string; replyId: string }

// Must be mounted inside ConversationProvider and PreferencesProvider: the agent's UI tools drive them.
export const AgentProvider = (props: ParentProps) => {
  const conversation = useConversation()
  const preferences = usePreferences()
  const i18n = useI18n()

  const [turn, setTurn] = createSignal<Turn | undefined>(undefined, { name: 'agentTurn' })
  let nextTurn = 0
  // Signal writes are batched, so ask() reads the latest turn from here instead of turn().
  let latestTurn: Turn | undefined

  const chat = useAgentChat({
    // Topic navigation goes through run() so its answered/head de-dupe sees it; the agent's reply
    // already stands in for the visitor's input, so the topic isn't echoed.
    tools: createClientTools({
      run: (key) => conversation.run(key, { echo: false }),
      theme: preferences.theme,
      setTheme: preferences.setTheme,
      locale: i18n.locale,
      setLocale: preferences.setLocale,
      // Repeated identical tool calls within one turn are ignored.
      requestId: () => turn()?.chatId,
    }),
    body: { locale: untrack(() => i18n.locale()) },
  })

  // The server reads the reply language from forwardedProps.locale.
  createEffect(
    () => i18n.locale(),
    (locale) => chat.updateBody({ locale }),
    { name: 'agentLocaleBody' }
  )

  // Only the latest turn is live; earlier replies keep the state they settled in.
  createEffect(
    () => {
      const current = turn()
      if (!current) return undefined
      const reply = mapTurnReply(chat.messages(), current.chatId, {
        isLoading: chat.isLoading(),
        hasError: chat.error() !== undefined,
      })
      return { id: current.replyId, reply }
    },
    (next) => {
      if (next) conversation.updateReply(next.id, next.reply)
    },
    { name: 'agentReplyToThread' }
  )

  onSettled(() =>
    conversation.onClear(() => {
      latestTurn = undefined
      setTurn(undefined)
      chat.clear()
    })
  )

  const ask = (text: string) => {
    const content = text.trim()
    if (!content) return
    // A new question interrupts the previous one: settle its reply with whatever text it got.
    const previous = latestTurn
    if (previous) {
      conversation.updateReply(
        previous.replyId,
        mapTurnReply(
          untrack(() => chat.messages()),
          previous.chatId,
          { isLoading: false, hasError: untrack(() => chat.error() !== undefined) }
        )
      )
    }
    const replyId = conversation.ask(content)
    const chatId = `agent-turn-${nextTurn++}`
    latestTurn = { chatId, replyId }
    setTurn(latestTurn)
    void chat.sendMessage({ content, id: chatId }, { whenBusy: 'interrupt' })
  }

  const value: AgentContextValue = {
    ask,
    retry: () => void chat.reload(),
    stop: chat.stop,
    isLoading: chat.isLoading,
    hasError: () => chat.error() !== undefined,
  }

  return <AgentContext value={value}>{props.children}</AgentContext>
}
