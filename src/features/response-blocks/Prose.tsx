import { Match, Switch } from 'solid-js'
import type { ParentProps } from 'solid-js'

// Vertical rhythm and measure for a run of paragraphs
export const Prose = (props: ParentProps) => (
  <div class="text-secondary-foreground flex max-w-[62ch] flex-col gap-3.5">{props.children}</div>
)

export type ProseParagraphProps = ParentProps<{
  tone?: 'lead' | 'body' | 'quote'
}>

export const ProseParagraph = (props: ProseParagraphProps) => (
  <Switch fallback={<p class="text-pretty">{props.children}</p>}>
    <Match when={props.tone === 'lead'}>
      <p class="text-lead text-pretty">{props.children}</p>
    </Match>
    <Match when={props.tone === 'quote'}>
      <blockquote class="border-border text-foreground border-l-2 pl-4 text-pretty">
        {props.children}
      </blockquote>
    </Match>
  </Switch>
)

export const Emphasis = (props: ParentProps) => (
  <strong class="text-foreground font-medium">{props.children}</strong>
)
