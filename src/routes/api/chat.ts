import { createFileRoute } from '@tanstack/solid-router'
import { env } from 'cloudflare:workers'

import {
  agentToolNames,
  createChatResponse,
  errorResponse,
  isAllowedOrigin,
  PAYLOAD_TOO_LARGE_MESSAGE,
  parseChatRequest,
  readBodyWithLimit,
} from '@features/agent-api'

/**
 * Best-effort per-IP limit through the Workers rate limiting binding (wrangler.jsonc). Its counters
 * are per Cloudflare location and eventually consistent, so this caps abuse rather than enforcing an
 * exact quota; a missing binding or a limiter failure lets the request through.
 */
const isRateLimited = async (request: Request) => {
  const ip = request.headers.get('cf-connecting-ip')
  if (!env.CHAT_RATE_LIMITER || !ip) return false
  try {
    const { success } = await env.CHAT_RATE_LIMITER.limit({ key: ip })
    return !success
  } catch (error) {
    console.error('[agent] rate limiter failed', error)
    return false
  }
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAllowedOrigin(request, import.meta.env.DEV)) {
          return errorResponse(403, 'forbidden_origin', 'Requests must come from this site.')
        }

        if (await isRateLimited(request)) {
          return errorResponse(
            429,
            'rate_limited',
            'Too many messages at once. Please wait a moment and try again.'
          )
        }

        const apiKey = env.OPENROUTER_API_KEY
        if (!apiKey) {
          console.error('[agent] OPENROUTER_API_KEY is not set')
          return errorResponse(500, 'missing_api_key', 'The assistant is not configured yet.')
        }

        const body = await readBodyWithLimit(request)
        if (!body.ok) {
          return body.code === 'payload_too_large'
            ? errorResponse(413, body.code, PAYLOAD_TOO_LARGE_MESSAGE)
            : errorResponse(400, body.code, 'The request is not a valid chat message.')
        }

        const parsed = parseChatRequest(body.text, agentToolNames)
        if (!parsed.ok) return errorResponse(parsed.status, parsed.code, parsed.message)

        return createChatResponse(parsed.data, apiKey, request.signal)
      },
    },
  },
})
