import { createFileRoute } from '@tanstack/solid-router'

const Work = () => (
  <section class="flex flex-col gap-2">
    <h1 class="text-primary text-lg">/work</h1>
    <p class="text-foreground text-sm">What I shipped, and where</p>
    <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
  </section>
)

export const Route = createFileRoute('/work')({
  component: Work,
})
