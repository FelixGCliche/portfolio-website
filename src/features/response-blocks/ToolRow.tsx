import { For, Show } from 'solid-js'

export type ToolRowProps = {
  area: string
  tools: string[]
  count?: string
}

// One area of a toolbox table; stacks on narrow widths
export const ToolRow = (props: ToolRowProps) => (
  <div class="border-border grid grid-cols-1 items-baseline gap-x-4 gap-y-1 border-t px-5 py-3 first:border-t-0 sm:grid-cols-[minmax(84px,130px)_minmax(0,1fr)_auto]">
    <span class="text-label text-muted-foreground font-bold tracking-[.06em] uppercase">
      {props.area}
    </span>
    <ul class="flex flex-wrap gap-x-2.5 gap-y-1.5">
      <For each={props.tools}>
        {(tool) => (
          <li>
            <span class="text-muted-foreground" aria-hidden="true">
              [
            </span>
            {tool}
            <span class="text-muted-foreground" aria-hidden="true">
              ]
            </span>
          </li>
        )}
      </For>
    </ul>
    <Show when={props.count}>
      <span class="text-label text-muted-foreground whitespace-nowrap">{props.count}</span>
    </Show>
  </div>
)
