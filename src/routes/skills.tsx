import { createFileRoute } from '@tanstack/solid-router'

const Skills = () => (
  <section class="flex flex-col gap-2">
    <h1 class="text-primary text-lg">/skills</h1>
    <p class="text-foreground text-sm">The toolbox, honestly rated</p>
    <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
  </section>
)

export const Route = createFileRoute('/skills')({
  component: Skills,
})
