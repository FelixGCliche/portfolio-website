import { useSession } from '@features/sessions'
import type { SessionKey } from '@features/sessions'

export const Placeholder = (props: { session: SessionKey }) => {
  const session = useSession(() => props.session)

  return (
    <>
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 class="text-foreground font-medium break-words">{session().key}</h2>
        <span class="text-primary text-xs">{session().meta}</span>
      </div>
      <p class="text-foreground max-w-[66ch] leading-[1.8] text-pretty">{session().desc}</p>
      <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
    </>
  )
}
