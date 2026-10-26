// eslint-disable-next-line solid/imports -- solid-js 2.x has no JSX types; the renderer package owns them
import type { JSX } from '@solidjs/web'
import { For } from 'solid-js'

export type KeyValueRow = {
  key: string
  value: JSX.Element
  tone?: 'success'
}

export type KeyValueProps = {
  rows: KeyValueRow[]
}

export const KeyValue = (props: KeyValueProps) => (
  <dl class="grid grid-cols-[minmax(68px,110px)_minmax(0,1fr)] gap-x-4 gap-y-1">
    <For each={props.rows}>
      {(row) => (
        <>
          <dt class="text-muted-foreground">{row.key}</dt>
          <dd class={['font-medium', row.tone === 'success' ? 'text-success' : 'text-foreground']}>
            {row.value}
          </dd>
        </>
      )}
    </For>
  </dl>
)
