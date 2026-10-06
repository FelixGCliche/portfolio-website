import { createFileRoute, redirect } from '@tanstack/solid-router'

import { detectLocale } from '@features/i18n'
import { topicRoute } from '@features/topics'

// Client-only: detectLocale() reads storage and navigator, which don't exist on the server.
export const Route = createFileRoute('/')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({
      ...topicRoute(detectLocale()),
      replace: true,
    })
  },
})
