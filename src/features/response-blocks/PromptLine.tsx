import { Show } from 'solid-js'

import { cn } from '@components'

export type PromptLineProps = {
  class?: string
  text: string
  // Shows a blinking block caret after the text
  caret?: boolean
}

export const PromptLine = (props: PromptLineProps) => (
  <div class={cn('flex min-w-0 gap-3 font-medium', props.class)}>
    <span class="text-success flex-none" aria-hidden="true">
      ›
    </span>
    <p class="flex min-w-0 items-center gap-1">
      <span class="min-w-0 [overflow-wrap:anywhere]">{props.text}</span>
      <Show when={props.caret}>
        <span
          class="bg-primary animate-caret-blink inline-block h-[17px] w-2 flex-none motion-reduce:animate-none"
          aria-hidden="true"
        />
      </Show>
    </p>
  </div>
)
