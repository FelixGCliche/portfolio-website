import { createFileRoute } from '@tanstack/solid-router'

const Home = () => (
  <div class="flex flex-col gap-4 p-2">
    <div class="flex flex-col gap-4 text-xl">
      <p class="font-montreal">Whereas recognition of the inherent dignity</p>
      <p class="font-montreal font-bold italic">Whereas recognition of the inherent dignity</p>
      <p class="font-montreal-text">Whereas recognition of the inherent dignity</p>
      <p class="font-montreal-text font-bold italic">Whereas recognition of the inherent dignity</p>
      <p class="font-eiko">Whereas recognition of the inherent dignity</p>
      <p class="font-eiko font-bold italic">Whereas recognition of the inherent dignity</p>
    </div>
  </div>
)

export const Route = createFileRoute('/')({
  component: Home,
})
