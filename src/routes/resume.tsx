import { createFileRoute } from '@tanstack/solid-router'

import { ResumeResponse } from '@features/conversation'

const Resume = () => (
  <section class="flex flex-col gap-4">
    <ResumeResponse />
  </section>
)

export const Route = createFileRoute('/resume')({
  component: Resume,
})
