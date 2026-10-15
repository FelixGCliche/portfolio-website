// eslint-disable-next-line solid/imports -- solid-js 2.x has no JSX types; the renderer package owns them
import type { JSX } from '@solidjs/web'
import { For } from 'solid-js'

export type BulletListProps = {
  items: JSX.Element[]
}

export const BulletList = (props: BulletListProps) => (
  <ul class="flex flex-col gap-1">
    <For each={props.items}>
      {(item) => (
        <li class="flex gap-2.5">
          <span class="text-muted-foreground flex-none" aria-hidden="true">
            ▸
          </span>
          <span class="min-w-0">{item}</span>
        </li>
      )}
    </For>
  </ul>
)
