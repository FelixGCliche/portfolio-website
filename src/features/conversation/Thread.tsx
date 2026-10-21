import { Dynamic } from '@solidjs/web'
import { useRouter } from '@tanstack/solid-router'
import { createEffect, For, Match, onSettled, Show, Switch } from 'solid-js'

import { useI18n } from '@features/i18n'
import { Markdown } from '@features/markdown'
import { Blocks } from '@features/reply-blocks'
import { BlockActionsProvider, PromptLine } from '@features/response-blocks'
import { responses } from '@features/topic-responses'
import { topicRoute } from '@features/topics'
import type { TopicKey } from '@features/topics'

import { useConversation } from './ConversationProvider'
import type {
  AgentMessage,
  AgentTextMessage,
  AgentTopicMessage,
  ReplyPart,
  UserMessage,
} from './messages'

const SCROLLER_SELECTOR = '[data-scroller]'
const PIN_THRESHOLD = 80
const ROW_CLASS = 'animate-rise flex motion-reduce:animate-none'

// Distinct per status so a status change alone registers as growth for auto-scroll.
const STATUS_WEIGHT: Record<AgentTextMessage['status'], number> = {
  pending: 0,
  streaming: 1,
  done: 2,
  error: 3,
}

// Rough rendered size of a reply part, so streamed text and blocks both register as growth.
// Blocks only appear once finished, so counting them (and completion) is enough, and stays O(1).
const partSize = (part: ReplyPart) =>
  part.kind === 'text' ? part.text.length : part.blocks.length * 2 + Number(part.complete)

const partOf = <K extends ReplyPart['kind']>(part: ReplyPart, kind: K) =>
  part.kind === kind ? (part as Extract<ReplyPart, { kind: K }>) : undefined

const distanceFromBottom = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight

const UserRow = (props: { message: UserMessage }) => (
  <PromptLine class={ROW_CLASS} text={props.message.text} />
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
            <Switch>
              <Match when={partOf(part(), 'text')}>
                {(text) => <Markdown text={text().text} />}
              </Match>
              <Match when={partOf(part(), 'blocks')}>
                {(blocks) => <Blocks blocks={blocks().blocks} />}
              </Match>
            </Switch>
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
  <Show
    when={props.message.kind === 'text' && (props.message as AgentTextMessage)}
    fallback={<TopicRow message={props.message as AgentTopicMessage} />}
  >
    {(message) => <TextRow message={message()} />}
  </Show>
)

export const Thread = () => {
  const { t, locale } = useI18n()
  const conversation = useConversation()
  const router = useRouter()
  let threadEl: HTMLDivElement | undefined
  let pinned = true
  const runTopic = (key: TopicKey) => conversation.run(key)
  // Hrefs cached per locale and topic; reading locale() keeps callers reactive to language changes
  const hrefs = new Map<string, string>()
  const topicHref = (key: TopicKey) => {
    const lang = locale()
    const id = `${lang}:${key}`
    let href = hrefs.get(id)
    if (href === undefined) {
      href = router.buildLocation(topicRoute(lang, key)).href
      hrefs.set(id, href)
    }
    return href
  }

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
      // Streaming replies grow in place: track their total size so a pinned thread follows them,
      // even when a topic row lands after the streaming reply.
      let size = 0
      for (const message of messages) {
        if (message.role !== 'agent' || message.kind !== 'text') continue
        size += message.parts.reduce((total, part) => total + partSize(part), 0)
        size += STATUS_WEIGHT[message.status]
      }
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
      <BlockActionsProvider runTopic={runTopic} topicHref={topicHref}>
        <For each={conversation.state.messages}>
          {(message) =>
            message.role === 'user' ? <UserRow message={message} /> : <AgentRow message={message} />
          }
        </For>
      </BlockActionsProvider>
    </div>
  )
}
