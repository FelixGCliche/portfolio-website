import { createFileRoute } from '@tanstack/solid-router'

const Projects = () => (
  <div class="flex min-h-screen flex-col items-center justify-center">
    <p class="font-eiko text-4xl font-light text-polar-0 dark:text-snow-6">Projects</p>
  </div>
)

export const Route = createFileRoute('/projects')({
  component: Projects,
})
