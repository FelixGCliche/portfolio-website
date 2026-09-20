import { createFileRoute } from '@tanstack/solid-router'

const About = () => (
  <section class="flex flex-col gap-2">
    <h1 class="text-primary text-lg">/about</h1>
    <p class="text-foreground text-sm">How I got here, briefly</p>
    <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
  </section>
)

export const Route = createFileRoute('/about')({
  component: About,
})
