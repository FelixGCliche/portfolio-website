import { createFileRoute } from '@tanstack/solid-router'

import { AboutResponse } from '@features/conversation'

const About = () => (
  <section class="flex flex-col gap-4">
    <AboutResponse />
  </section>
)

export const Route = createFileRoute('/about')({
  component: About,
})
