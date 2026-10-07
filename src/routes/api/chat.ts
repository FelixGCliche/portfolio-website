import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'

import {
  createChatResponse,
  errorResponse,
  MAX_BODY_BYTES,
  parseChatRequest,
} from '@features/agent'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = env.OPENROUTER_API_KEY
        if (!apiKey) {
          console.error('[agent] OPENROUTER_API_KEY is not set')
          return errorResponse(500, 'missing_api_key', 'The assistant is not configured yet.')
        }

        // Reject oversized bodies before buffering them; parseChatRequest re-checks the actual size.
        if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
          return errorResponse(
            413,
            'payload_too_large',
            'The conversation is too long. Please start a new one.'
          )
        }

        const parsed = parseChatRequest(await request.text())
        if (!parsed.ok) return errorResponse(parsed.status, parsed.code, parsed.message)

        return createChatResponse(parsed.data, apiKey, request.signal)
      },
    },
  },
})
