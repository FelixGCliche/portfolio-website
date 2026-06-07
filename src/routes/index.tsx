import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div class="flex flex-col gap-4 text-xl m-2">
      <p class="font-montreal">Whereas recognition of the inherent dignity</p>
      <p class="font-montreal font-bold italic">Whereas recognition of the inherent dignity</p>
      <p class="font-montreal-text">Whereas recognition of the inherent dignity</p>
      <p class="font-montreal-text font-bold italic">Whereas recognition of the inherent dignity</p>
      <p class="font-eiko">Whereas recognition of the inherent dignity</p>
      <p class="font-eiko font-bold italic">Whereas recognition of the inherent dignity</p>
    </div>
  )
}
