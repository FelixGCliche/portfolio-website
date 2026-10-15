import { createMemo, For, Match, Switch } from 'solid-js'

import { cn } from '@components'
import { NextLink, ProseParagraph } from '@features/response-blocks'
import { isTopicHref } from '@features/safe-links'
import type { TopicKey } from '@features/topic-keys'

import { type MdBlock, type MdInline, parseMarkdown } from './parse'

const LINK_CLASS = 'focus-ring text-primary underline underline-offset-4 hover:opacity-80'

const topicOf = (value: string): TopicKey | undefined => (isTopicHref(value) ? value : undefined)

const blockOf = <K extends MdBlock['type']>(block: MdBlock, type: K) =>
  block.type === type ? (block as Extract<MdBlock, { type: K }>) : undefined

const orderedOf = (block: MdBlock) => (block.type === 'list' && block.ordered ? block : undefined)

// Index-keyed so a growing (streaming) inline run updates nodes in place instead of remounting
const Inlines = (props: { inlines: MdInline[] }) => (
  <For each={props.inlines} keyed={false}>
    {(node) => <Inline node={node()} />}
  </For>
)

const Inline = (props: { node: MdInline }) => (
  <Switch>
    <Match when={props.node.type === 'text' && props.node}>{(node) => <>{node().text}</>}</Match>
    <Match when={props.node.type === 'strong' && props.node}>
      {(node) => (
        <strong class="text-foreground font-bold">
          <Inlines inlines={node().children} />
        </strong>
      )}
    </Match>
    <Match when={props.node.type === 'em' && props.node}>
      {(node) => (
        <em>
          <Inlines inlines={node().children} />
        </em>
      )}
    </Match>
    <Match when={props.node.type === 'code' && props.node}>
      {(node) => (
        <Switch fallback={<code class="text-foreground bg-muted px-1">{node().text}</code>}>
          <Match when={topicOf(node().text)}>{(topic) => <NextLink topic={topic()} />}</Match>
        </Switch>
      )}
    </Match>
    <Match when={props.node.type === 'link' && props.node}>
      {(node) => (
        <Switch
          fallback={
            <a
              href={node().href}
              target={node().href.startsWith('https://') ? '_blank' : undefined}
              rel={node().href.startsWith('https://') ? 'noopener noreferrer' : undefined}
              class={LINK_CLASS}
            >
              <Inlines inlines={node().children} />
            </a>
          }
        >
          <Match when={topicOf(node().href)}>
            {(topic) => (
              <NextLink topic={topic()}>
                <Inlines inlines={node().children} />
              </NextLink>
            )}
          </Match>
        </Switch>
      )}
    </Match>
  </Switch>
)

export type MarkdownProps = {
  text: string
  // Renders the first paragraph in the lead tone
  leadFirst?: boolean
  class?: string
}

/**
 * Renders the light markdown subset from `parseMarkdown` as Solid elements (never as HTML).
 * Blocks are index-keyed, so a streaming reply grows in place without remounting earlier blocks.
 */
export const Markdown = (props: MarkdownProps) => {
  const ast = createMemo(() => parseMarkdown(props.text), { name: 'markdownAst' })

  return (
    <div class={cn('text-secondary-foreground flex max-w-[62ch] flex-col gap-3.5', props.class)}>
      <For each={ast()} keyed={false}>
        {(block, index) => (
          <Switch>
            <Match when={blockOf(block(), 'paragraph')}>
              {(paragraph) => (
                <ProseParagraph tone={props.leadFirst && index === 0 ? 'lead' : 'body'}>
                  <span class="whitespace-pre-line">
                    <Inlines inlines={paragraph().inlines} />
                  </span>
                </ProseParagraph>
              )}
            </Match>
            <Match when={blockOf(block(), 'list')}>
              {(list) => (
                <Switch
                  fallback={
                    <ul class="flex flex-col gap-1">
                      <For each={list().items} keyed={false}>
                        {(item) => (
                          <li class="flex gap-2.5">
                            <span class="text-muted-foreground flex-none" aria-hidden="true">
                              ▸
                            </span>
                            <span class="min-w-0 whitespace-pre-line">
                              <Inlines inlines={item()} />
                            </span>
                          </li>
                        )}
                      </For>
                    </ul>
                  }
                >
                  <Match when={orderedOf(list())}>
                    {(ordered) => (
                      <ol class="flex flex-col gap-1" start={ordered().start}>
                        {/* Non-keyed For passes the index as a plain number, not an accessor */}
                        <For each={ordered().items} keyed={false}>
                          {(item, itemIndex) => (
                            <li class="flex gap-2.5">
                              <span
                                class="text-muted-foreground flex-none tabular-nums"
                                aria-hidden="true"
                              >
                                {ordered().start + itemIndex}.
                              </span>
                              <span class="min-w-0 whitespace-pre-line">
                                <Inlines inlines={item()} />
                              </span>
                            </li>
                          )}
                        </For>
                      </ol>
                    )}
                  </Match>
                </Switch>
              )}
            </Match>
          </Switch>
        )}
      </For>
    </div>
  )
}
