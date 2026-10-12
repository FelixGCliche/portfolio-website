import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'

import { handleChatRequest } from '@features/agent-api'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: ({ request }) => handleChatRequest(request, { env, dev: import.meta.env.DEV }),
    },
  },
})
