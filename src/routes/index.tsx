import { createFileRoute } from '@tanstack/solid-router'

import { Thread } from '@features/conversation'

const Home = () => <Thread />

export const Route = createFileRoute('/')({
  component: Home,
})
