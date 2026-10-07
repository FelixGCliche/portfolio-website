import { Dynamic } from '@solidjs/web'
import { createEffect, For, Match, onSettled, Show, Switch } from 'solid-js'

import { useI18n } from '@features/i18n'

import { useConversation } from './ConversationProvider'
import type { AgentMessage, AgentTextMessage, AgentTopicMessage, UserMessage } from './messages'
import { responses } from './responses'

const SCROLLER_SELECTOR = '[data-scroller]'
const PIN_THRESHOLD = 80
const ROW_CLASS = 'animate-rise flex motion-reduce:animate-none'

const distanceFromBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight

const UserRow = (props: { message: UserMessage }) => (
  <div class={`${ROW_CLASS} gap-3 font-medium`}>
    <span class="text-success flex-none" aria-hidden="true">
      ›
    </span>
    <p class="min-w-0 break-words">{props.message.text}</p>
  </div>
)

const AGENT_ROW_CLASS = `${ROW_CLASS} flex-col gap-4 pt-3 pl-[26px]`

const TopicRow = (props: { message: AgentTopicMessage }) => (
  <div class={AGENT_ROW_CLASS}>
    <Dynamic component={responses[props.message.topic]} />
  </div>
)

// A streamed agent reply. Upstream error details are never shown, only a friendly message.
const TextRow = (props: { message: AgentTextMessage }) => {
  const { t } = useI18n()

  return (
    <Show when={props.message.status !== 'done' || props.message.parts.length > 0}>
      <div
        class={AGENT_ROW_CLASS}
        aria-busy={
          props.message.status === 'pending' || props.message.status === 'streaming'
            ? 'true'
            : undefined
        }
      >
        <For each={props.message.parts} keyed={false}>
          {(part) => (
            <p class="text-foreground max-w-[66ch] leading-[1.8] text-pretty whitespace-pre-wrap">
              {part()}
            </p>
          )}
        </For>
        <Switch>
          <Match when={props.message.status === 'pending'}>
            <p class="text-muted-foreground animate-pulse text-xs motion-reduce:animate-none">
              {t('agent.thinking')}
            </p>
          </Match>
          <Match when={props.message.status === 'error'}>
            <p class="text-destructive text-xs" role="alert">
              {t('agent.error')}
            </p>
          </Match>
        </Switch>
      </div>
    </Show>
  )
}

const AgentRow = (props: { message: AgentMessage }) => (
  <>
    {props.message.kind === 'topic' ? (
      <TopicRow message={props.message} />
    ) : (
      <TextRow message={props.message} />
    )}
  </>
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
    (prev?: { count: number; fromUser: boolean; size: number }) => {
      const messages = conversation.state.messages
      let fromUser = false
      for (let i = prev?.count ?? messages.length; i < messages.length; i++) {
        if (messages[i].role === 'user') fromUser = true
      }
      // A streaming reply grows in place: track its size so a pinned thread follows it.
      const last = messages.at(-1)
      const size =
        last?.role === 'agent' && last.kind === 'text'
          ? last.parts.reduce((total, part) => total + part.length, 0) + last.status.length
          : 0
      return { count: messages.length, fromUser, size }
    },
    (next, prev) => {
      if (!prev) return
      const added = next.count > prev.count
      if (!added && (next.count < prev.count || next.size === prev.size)) return
      if (!pinned && !(added && next.fromUser)) return
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
