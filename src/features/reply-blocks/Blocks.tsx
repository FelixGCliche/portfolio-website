import { Dynamic } from '@solidjs/web'
import { For, Show } from 'solid-js'
import type { Component } from 'solid-js'

import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components'
import type { Block, BlockOf, BlockType } from '@features/block-schema'
import { Markdown } from '@features/markdown'
import {
  BulletList,
  KeyValue,
  LinkCard,
  NextLinks,
  PanelHeader,
  Tag,
  Timeline,
  TimelineItem,
  ToolRow,
} from '@features/response-blocks'

type BlockProps<T extends BlockType> = { block: BlockOf<T> }

const HeadingBlock = (props: BlockProps<'heading'>) => (
  <PanelHeader label={props.block.label} meta={props.block.meta} metaTone={props.block.metaTone} />
)

const ProseBlock = (props: BlockProps<'prose'>) => (
  <Markdown text={props.block.text} tone={props.block.tone} />
)

const KeyValueBlock = (props: BlockProps<'keyValue'>) => (
  <Card class="px-[18px]">
    <KeyValue rows={props.block.rows} />
  </Card>
)

const ListBlock = (props: BlockProps<'list'>) => (
  <div class="text-secondary-foreground">
    <BulletList items={props.block.items} />
  </div>
)

const TagsBlock = (props: BlockProps<'tags'>) => (
  <ul class="flex flex-wrap gap-2">
    <For each={props.block.items}>
      {(item) => (
        <li>
          <Tag>{item}</Tag>
        </li>
      )}
    </For>
  </ul>
)

const TableBlock = (props: BlockProps<'table'>) => (
  <Card class="py-0">
    <Table>
      <TableHeader>
        <TableRow>
          <For each={props.block.columns}>{(column) => <TableHead>{column}</TableHead>}</For>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={props.block.rows} keyed={false}>
          {(row) => (
            <TableRow>
              <For each={row()} keyed={false}>
                {(cell) => <TableCell class="min-w-[14ch]">{cell()}</TableCell>}
              </For>
            </TableRow>
          )}
        </For>
      </TableBody>
    </Table>
  </Card>
)

const ToolRowsBlock = (props: BlockProps<'toolRows'>) => (
  <Card class="gap-0 py-0">
    <For each={props.block.rows} keyed={false}>
      {(row) => <ToolRow area={row().area} tools={row().tools} />}
    </For>
  </Card>
)

const TimelineBlock = (props: BlockProps<'timeline'>) => (
  <Timeline>
    <For each={props.block.items} keyed={false}>
      {(item) => (
        <TimelineItem
          title={item().title}
          company={item().company}
          range={item().range}
          current={item().current}
        >
          <Show when={item().bullets?.length}>
            <div class="text-secondary-foreground">
              <BulletList items={item().bullets ?? []} />
            </div>
          </Show>
        </TimelineItem>
      )}
    </For>
  </Timeline>
)

const LinksBlock = (props: BlockProps<'links'>) => (
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <For each={props.block.items} keyed={false}>
      {(item) => <LinkCard label={item().label} value={item().value} href={item().href} />}
    </For>
  </div>
)

const NextBlock = (props: BlockProps<'next'>) => <NextLinks topics={props.block.topics} />

/** The component rendering each block type. */
export const blockComponents: { [T in BlockType]: Component<BlockProps<T>> } = {
  heading: HeadingBlock,
  prose: ProseBlock,
  keyValue: KeyValueBlock,
  list: ListBlock,
  tags: TagsBlock,
  table: TableBlock,
  toolRows: ToolRowsBlock,
  timeline: TimelineBlock,
  links: LinksBlock,
  next: NextBlock,
}

// The registry is typed per block type; looked up by a runtime type, it takes any block.
const componentFor = (type: BlockType) => blockComponents[type] as Component<{ block: Block }>

export type BlocksProps = {
  blocks: readonly Block[]
}

/**
 * Renders the agent's `render_blocks` blocks in order. Index-keyed, so a growing (streaming) array
 * updates earlier blocks in place instead of remounting them.
 */
export const Blocks = (props: BlocksProps) => (
  <div class="flex flex-col gap-5">
    <For each={props.blocks} keyed={false}>
      {(block) => <Dynamic component={componentFor(block().type)} block={block()} />}
    </For>
  </div>
)
