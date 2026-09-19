import { createFileRoute } from '@tanstack/solid-router'

const Contact = () => (
  <section class="flex flex-col gap-2">
    <h1 class="text-primary text-lg">/contact</h1>
    <p class="text-foreground text-sm">Same-day answer, promised</p>
    <p class="text-muted-foreground text-xs">Placeholder — content lands in a later PR</p>
  </section>
)

export const Route = createFileRoute('/contact')({
  component: Contact,
})
