import { useTopic } from '@features/topics'
import type { TopicKey } from '@features/topics'

export const Placeholder = (props: { topic: TopicKey }) => {
  const topic = useTopic(() => props.topic)

  return (
    <>
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 class="text-foreground font-medium break-words">{topic().key}</h2>
        <span class="text-primary text-xs">{topic().meta}</span>
      </div>
      <p class="text-foreground max-w-[66ch] leading-[1.8] text-pretty">{topic().desc}</p>
      <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
    </>
  )
}
