import { createFileRoute } from '@tanstack/solid-router'

const Resume = () => (
  <section class="flex flex-col gap-2">
    <h1 class="text-primary text-lg">/resume</h1>
    <p class="text-foreground text-sm">The full CV, downloadable</p>
    <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
  </section>
)

export const Route = createFileRoute('/resume')({
  component: Resume,
})
