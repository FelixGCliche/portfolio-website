import { Show } from 'solid-js'

import { cn } from '@components'

import { isTypableCommand } from './promptText'

export type PromptLineProps = {
  class?: string
  text: string
  // Types the text out once on mount; only applies to a single-line ASCII '/command'
  animate?: boolean
  // Shows a blinking block caret after the text
  caret?: boolean
}

export const PromptLine = (props: PromptLineProps) => (
  <div class={cn('flex min-w-0 gap-3 font-medium', props.class)}>
    <span class="text-success flex-none" aria-hidden="true">
      ›
    </span>
    <p class="flex min-w-0 items-center gap-1 break-words">
      <Show when={props.animate && isTypableCommand(props.text)} fallback={props.text}>
        <span
          class="animate-typing inline-block w-[calc(var(--chars)*1ch)] overflow-hidden whitespace-nowrap motion-reduce:animate-none"
          style={{ '--chars': String(props.text.length) }}
        >
          {props.text}
        </span>
      </Show>
      <Show when={props.caret}>
        <span
          class="bg-primary animate-caret-blink inline-block h-[17px] w-2 flex-none motion-reduce:animate-none"
          aria-hidden="true"
        />
      </Show>
    </p>
  </div>
)
