import { Show } from 'solid-js'

export type PlaceholderProps = {
  title: string
  meta?: string
  desc: string
}

export const Placeholder = (props: PlaceholderProps) => (
  <>
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 class="text-foreground font-medium break-words">{props.title}</h2>
      <Show when={props.meta}>{(meta) => <span class="text-primary text-xs">{meta()}</span>}</Show>
    </div>
    <p class="text-foreground max-w-[66ch] leading-[1.8] text-pretty">{props.desc}</p>
    <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
  </>
)
