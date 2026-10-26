import { Show } from 'solid-js'
import type { ParentProps } from 'solid-js'

export type PanelHeaderProps = {
  label: string
  meta?: string
  metaTone?: 'success'
}

// A label, a rule filling the row, and optional meta on the right
export const PanelHeader = (props: PanelHeaderProps) => (
  <div class="text-label text-muted-foreground flex items-center gap-2.5">
    <span>{props.label}</span>
    <span class="bg-border h-px flex-1" aria-hidden="true" />
    <Show when={props.meta}>
      <span class={props.metaTone === 'success' ? 'text-success' : undefined}>{props.meta}</span>
    </Show>
  </div>
)

export const SectionLabel = (props: ParentProps) => (
  <p class="text-label text-muted-foreground uppercase">{props.children}</p>
)
