import { Dynamic } from '@solidjs/web'
import { createEffect, For, Match, onSettled, Show, Switch } from 'solid-js'

import { useConversation } from './ConversationProvider'
import type { Message } from './ConversationProvider'
import { responses } from './responses'

const SCROLLER_SELECTOR = '[role="region"][aria-label="Content"]'
const PIN_THRESHOLD = 80

const distanceFromBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight

const UserRow = (props: { message: Message }) => (
  <div class="animate-rise flex gap-3 font-medium motion-reduce:animate-none">
    <span class="text-success flex-none" aria-hidden="true">
      ›
    </span>
    <p class="min-w-0 break-words">{props.message.text}</p>
  </div>
)

const AgentRow = (props: { message: Message }) => (
  <div class="animate-rise flex flex-col gap-4 pt-3 pl-[26px] motion-reduce:animate-none">
    <Show when={props.message.session}>
      {(session) => <Dynamic component={responses[session()]} />}
    </Show>
  </div>
)

export const Thread = () => {
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
      const appended = messages.slice(prev?.count ?? messages.length)
      return { count: messages.length, fromUser: appended.some((m) => m.role === 'user') }
    },
    (next, prev) => {
      if (!prev || next.count <= prev.count) return
      if (!pinned && !next.fromUser) return
      const el = scroller()
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' })
      pinned = true
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
      aria-label="Conversation"
      class="mx-auto flex w-full max-w-[700px] flex-col gap-6 px-4 py-6 sm:px-6"
    >
      <For each={conversation.state.messages}>
        {(message) => (
          <Switch>
            <Match when={message.role === 'user'}>
              <UserRow message={message} />
            </Match>
            <Match when={message.role === 'agent'}>
              <AgentRow message={message} />
            </Match>
          </Switch>
        )}
      </For>
    </div>
  )
}
