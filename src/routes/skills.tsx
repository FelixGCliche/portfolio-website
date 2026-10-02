import { createFileRoute } from '@tanstack/solid-router'

import { SkillsResponse } from '@features/conversation'

const Skills = () => (
  <section class="flex flex-col gap-4">
    <SkillsResponse />
  </section>
)

export const Route = createFileRoute('/skills')({
  component: Skills,
})
