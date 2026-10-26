// eslint-disable-next-line solid/imports -- solid-js 2.x has no JSX types; the renderer package owns them
import type { JSX } from '@solidjs/web'
import { For } from 'solid-js'

import { useI18n } from '@features/i18n'
import type { TopicKey } from '@features/topic-keys'

import { useBlockActions } from './BlockActions'

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

export type NextLinkProps = {
  topic: TopicKey
  // Defaults to the topic command, e.g. '/work'
  children?: JSX.Element
}

// A real link to the topic's URL; a plain click runs the topic in the conversation instead
export const NextLink = (props: NextLinkProps) => {
  const actions = useBlockActions()

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || !isPlainClick(event)) return
    event.preventDefault()
    actions.runTopic(props.topic)
  }

  return (
    <a
      href={actions.topicHref(props.topic)}
      onClick={onClick}
      class="focus-ring text-primary inline-flex min-h-11 items-center px-2 underline underline-offset-4 hover:opacity-80"
    >
      {props.children ?? props.topic}
    </a>
  )
}

export type NextLinksProps = {
  // Defaults to the translated 'Next:'
  label?: string
  topics: TopicKey[]
}

export const NextLinks = (props: NextLinksProps) => {
  const { t } = useI18n()

  return (
    <div class="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-[12.5px]">
      <span class="mr-2">{props.label ?? t('blocks.next')}</span>
      <For each={props.topics}>{(topic) => <NextLink topic={topic} />}</For>
    </div>
  )
}
