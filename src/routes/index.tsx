import { createFileRoute } from '@tanstack/solid-router'

import { TokenPreview } from '@features/design-tokens'

const Home = () => <TokenPreview />

export const Route = createFileRoute('/')({
  component: Home,
})
