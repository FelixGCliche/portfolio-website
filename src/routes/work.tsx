import { createFileRoute } from '@tanstack/solid-router'

import { WorkResponse } from '@features/conversation'

const Work = () => (
  <section class="flex flex-col gap-4">
    <WorkResponse />
  </section>
)

export const Route = createFileRoute('/work')({
  component: Work,
})
