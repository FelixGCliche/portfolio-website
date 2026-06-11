import { createFileRoute } from '@tanstack/solid-router'

const About = () => (
  <div class="flex min-h-screen flex-col items-center justify-center">
    <p class="font-eiko text-4xl font-light text-polar-0 dark:text-snow-6">About</p>
  </div>
)

export const Route = createFileRoute('/about')({
  component: About,
})
