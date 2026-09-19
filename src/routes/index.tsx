import { createFileRoute } from '@tanstack/solid-router'

import { TokenPreview } from '../components/TokenPreview'

const Home = () => <TokenPreview />

export const Route = createFileRoute('/')({
  component: Home,
})
