import { Dynamic } from '@solidjs/web'
import { createMemo, For, Match, Show, Switch } from 'solid-js'

import { cn } from '@components'
import { useI18n } from '@features/i18n'
import { LINK_CLASS, NextLink, opensNewTab, Prose, ProseParagraph } from '@features/response-blocks'

import { type MdInline, type MdLink, type MdList, type MdListItem, parseMarkdown } from './parse'

/** `node` narrowed to one of `types`, or undefined: a `Match` condition that narrows. */
const ofType = <T extends { type: string }, K extends T['type']>(node: T, ...types: K[]) =>
  (types as string[]).includes(node.type) ? (node as Extract<T, { type: K }>) : undefined

// Index-keyed so a growing (streaming) inline run updates nodes in place instead of remounting
const Inlines = (props: { inlines: MdInline[] }) => (
  <For each={props.inlines} keyed={false}>
    {(node) => <Inline node={node()} />}
  </For>
)

// Keeps the source's line breaks inside a paragraph or list item
const InlineRun = (props: { inlines: MdInline[] }) => (
  <span class="whitespace-pre-line">
    <Inlines inlines={props.inlines} />
  </span>
)

const Link = (props: { link: MdLink }) => {
  const { t } = useI18n()
  const newTab = () => opensNewTab(props.link.href)

  return (
    <Show
      when={props.link.kind === 'topic' && props.link}
      fallback={
        <a
          href={props.link.href}
          target={newTab() ? '_blank' : undefined}
          rel={newTab() ? 'noopener noreferrer' : undefined}
          class={LINK_CLASS}
        >
          <Inlines inlines={props.link.children} />
          <Show when={newTab()}>
            <span class="sr-only"> {t('blocks.opensNewTab')}</span>
          </Show>
        </a>
      }
    >
      {(topic) => (
        <NextLink topic={topic().href}>
          <Inlines inlines={topic().children} />
        </NextLink>
      )}
    </Show>
  )
}

const Inline = (props: { node: MdInline }) => (
  <Switch>
    <Match when={ofType(props.node, 'text')}>{(node) => <>{node().text}</>}</Match>
    <Match when={ofType(props.node, 'strong', 'em')}>
      {(node) => (
        <Dynamic
          component={node().type}
          class={node().type === 'strong' ? 'text-foreground font-bold' : undefined}
        >
          <Inlines inlines={node().children} />
        </Dynamic>
      )}
    </Match>
    {/* Always code, even for a topic key: only link syntax becomes a topic link */}
    <Match when={ofType(props.node, 'code')}>
      {(node) => <code class="text-foreground bg-muted px-1">{node().text}</code>}
    </Match>
    <Match when={ofType(props.node, 'link')}>{(node) => <Link link={node()} />}</Match>
  </Switch>
)

const List = (props: { list: MdList }) => {
  const start = () => (props.list.ordered ? props.list.start : undefined)
  const marker = (index: number) => {
    const first = start()
    return first === undefined ? '▸' : `${first + index}.`
  }

  return (
    <Dynamic
      component={props.list.ordered ? 'ol' : 'ul'}
      class="flex flex-col gap-1"
      start={start()}
    >
      {/* Non-keyed For passes the index as a plain number, not an accessor */}
      <For each={props.list.items} keyed={false}>
        {(item, index) => (
          <li class="flex gap-2.5">
            <span
              class={cn('text-muted-foreground flex-none', props.list.ordered && 'tabular-nums')}
              aria-hidden="true"
            >
              {marker(index)}
            </span>
            <ListItemBody item={item()} />
          </li>
        )}
      </For>
    </Dynamic>
  )
}

// The item's text, then its sub-list (if any) below it
const ListItemBody = (props: { item: MdListItem }) => (
  <div class="flex min-w-0 flex-col gap-1">
    <InlineRun inlines={props.item.inlines} />
    <Show when={props.item.children}>{(children) => <List list={children()} />}</Show>
  </div>
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
    <Prose class={props.class}>
      <For each={ast()} keyed={false}>
        {(block, index) => (
          <Switch>
            <Match when={ofType(block(), 'paragraph')}>
              {(paragraph) => (
                <ProseParagraph tone={props.leadFirst && index === 0 ? 'lead' : 'body'}>
                  <InlineRun inlines={paragraph().inlines} />
                </ProseParagraph>
              )}
            </Match>
            <Match when={ofType(block(), 'list')}>{(list) => <List list={list()} />}</Match>
          </Switch>
        )}
      </For>
    </Prose>
  )
}
