import { Dynamic } from '@solidjs/web'
import { createEffect, For, onSettled } from 'solid-js'

import { useI18n } from '@features/i18n'

import { useConversation } from './ConversationProvider'
import type { Message } from './ConversationProvider'
import { responses } from './responses'

const SCROLLER_SELECTOR = '[data-scroller]'
const PIN_THRESHOLD = 80
const ROW_CLASS = 'animate-rise flex motion-reduce:animate-none'

const distanceFromBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight

type UserMessage = Extract<Message, { role: 'user' }>
type AgentMessage = Extract<Message, { role: 'agent' }>

const UserRow = (props: { message: UserMessage }) => (
  <div class={`${ROW_CLASS} gap-3 font-medium`}>
    <span class="text-success flex-none" aria-hidden="true">
      ›
    </span>
    <p class="min-w-0 break-words">{props.message.text}</p>
  </div>
)

const AgentRow = (props: { message: AgentMessage }) => (
  <div class={`${ROW_CLASS} flex-col gap-4 pt-3 pl-[26px]`}>
    <Dynamic component={responses[props.message.topic]} />
  </div>
)

export const Thread = () => {
  const { t } = useI18n()
  const conversation = useConversation()
  let threadEl: HTMLDivElement | undefined
  let pinned = true

  const scroller = () => threadEl?.closest<HTMLElement>(SCROLLER_SELECTOR) ?? undefined

  onSettled(() => {
    const el = scroller()
    if (!el) return
    const onScroll = () => {
      pinned = distanceFromBottom(el) <= PIN_THRESHOLD
    }
    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  })

  createEffect(
    (prev?: { count: number; fromUser: boolean }) => {
      const messages = conversation.state.messages
      let fromUser = false
      for (let i = prev?.count ?? messages.length; i < messages.length; i++) {
        if (messages[i].role === 'user') fromUser = true
      }
      return { count: messages.length, fromUser }
    },
    (next, prev) => {
      if (!prev || next.count <= prev.count) return
      if (!pinned && !next.fromUser) return
      const el = scroller()
      if (!el) return
      pinned = true
      requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: 'auto' }))
    },
    { name: 'threadAutoScroll' }
  )

  return (
    <div
      ref={(el) => {
        threadEl = el
      }}
      role="log"
      aria-live="polite"
      aria-label={t('thread.label')}
      class={[
        'mx-auto flex w-full max-w-[700px] flex-col gap-6 px-4 sm:px-6',
        { 'py-6': conversation.hasMessages() },
      ]}
    >
      <For each={conversation.state.messages}>
        {(message) =>
          message.role === 'user' ? <UserRow message={message} /> : <AgentRow message={message} />
        }
      </For>
    </div>
  )
}
