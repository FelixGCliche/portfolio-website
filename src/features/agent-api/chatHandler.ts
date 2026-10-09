import { parseChatRequest } from './chatRequest'
import { agentToolNames, createChatResponse } from './chatResponse'
import { errorResponse } from './errors'
import {
  isAllowedOrigin,
  isRateLimited,
  type RateLimiter,
  readBodyWithLimit,
} from './requestGuards'

/** The Worker bindings the chat endpoint reads. */
export type ChatEnv = {
  OPENROUTER_API_KEY?: string
  CHAT_RATE_LIMITER?: RateLimiter
}

export type ChatHandlerOptions = { env: ChatEnv; dev: boolean }

/**
 * Runs the whole `/api/chat` pipeline: origin check, rate limit, API key, size-limited body read,
 * validation, then the streamed agent response. Each guard short-circuits with a JSON error.
 */
export const handleChatRequest = async (
  request: Request,
  { env, dev }: ChatHandlerOptions
): Promise<Response> => {
  if (!isAllowedOrigin(request, dev)) {
    return errorResponse(403, 'forbidden_origin', 'Requests must come from this site.')
  }

  if (await isRateLimited(request, env.CHAT_RATE_LIMITER)) {
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
  if (!body.ok) return errorResponse(body.status, body.code, body.message)

  const parsed = parseChatRequest(body.text, agentToolNames)
  if (!parsed.ok) return errorResponse(parsed.status, parsed.code, parsed.message)

  return createChatResponse(parsed.data, apiKey, request.signal)
}
