import { Show } from 'solid-js'
import type { ParentProps } from 'solid-js'

export const Timeline = (props: ParentProps) => <ol class="flex flex-col">{props.children}</ol>

export type TimelineItemProps = ParentProps<{
  title: string
  company?: string
  range: string
  // A role still held: only it gets the accent dot
  current?: boolean
}>

export const TimelineItem = (props: TimelineItemProps) => (
  <li class="group grid grid-cols-[14px_minmax(0,1fr)] gap-x-3.5">
    <div class="flex flex-col items-center" aria-hidden="true">
      <span class={['mt-2 size-[9px] flex-none', props.current ? 'bg-primary' : 'bg-border']} />
      <span class="bg-border mt-1 min-h-3 w-px flex-1 group-last:hidden" />
    </div>
    <div class="flex min-w-0 flex-col gap-2 pb-[30px] group-last:pb-0">
      <div class="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <span class="text-foreground text-[15px] font-bold">{props.title}</span>
        <Show when={props.company}>
          <span class="text-secondary-foreground">@ {props.company}</span>
        </Show>
        <span class="text-label text-muted-foreground ml-auto">{props.range}</span>
      </div>
      {props.children}
    </div>
  </li>
)
