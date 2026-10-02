import type { Session } from '@features/sessions'

export const Placeholder = (props: { session: Session }) => (
  <>
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 class="text-foreground font-medium break-words">{props.session.key}</h2>
      <span class="text-primary text-xs">{props.session.meta}</span>
    </div>
    <p class="text-foreground max-w-[66ch] leading-[1.8] text-pretty">{props.session.desc}</p>
    <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
  </>
)
