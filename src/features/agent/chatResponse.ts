import {
  chat,
  chatParamsFromRequestBody,
  maxIterations,
  toServerSentEventsResponse,
} from '@tanstack/ai'
import { createOpenRouterText } from '@tanstack/ai-openrouter'

import type { ChatRequest, ChatRequestErrorCode } from './chatRequest'
import { agentTools } from './tools'

/** Primary model: free tier, supports tool calling, solid in English and French. */
export const AGENT_MODEL = 'google/gemma-4-31b-it:free'
/** Tried in order by OpenRouter when the primary model is rate-limited or unavailable. */
export const AGENT_FALLBACK_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-26b-a4b-it:free',
] as const
/** Most model turns (tool round-trips included) per request. */
export const MAX_AGENT_ITERATIONS = 5
/** Most tokens the model may generate per turn. */
export const MAX_COMPLETION_TOKENS = 1024

const SYSTEM_PROMPT =
  "You are the assistant on Felix Gagné-Cliche's portfolio website. Answer questions about Felix " +
  'briefly and politely. If you do not know something, say so instead of guessing.'

export type ErrorCode = ChatRequestErrorCode | 'missing_api_key' | 'upstream_error'

export const errorResponse = (status: number, code: ErrorCode, message: string) =>
  Response.json({ error: { code, message } }, { status })

/** Runs the agent loop for a validated request and streams it back as Server-Sent Events. */
export const createChatResponse = async (
  input: ChatRequest,
  apiKey: string,
  signal?: AbortSignal
): Promise<Response> => {
  let params: Awaited<ReturnType<typeof chatParamsFromRequestBody>>
  try {
    params = await chatParamsFromRequestBody(input)
  } catch {
    return errorResponse(400, 'invalid_request', 'The request is not a valid chat message.')
  }

  const abortController = new AbortController()
  signal?.addEventListener('abort', () => abortController.abort(), { once: true })

  try {
    const stream = chat({
      adapter: createOpenRouterText(AGENT_MODEL, apiKey),
      messages: params.messages,
      systemPrompts: [SYSTEM_PROMPT],
      tools: agentTools,
      agentLoopStrategy: maxIterations(MAX_AGENT_ITERATIONS),
      modelOptions: {
        models: [...AGENT_FALLBACK_MODELS],
        maxCompletionTokens: MAX_COMPLETION_TOKENS,
      },
      threadId: params.threadId,
      runId: params.runId,
      abortController,
    })
    return toServerSentEventsResponse(stream, { abortController })
  } catch (error) {
    console.error('[agent] failed to start chat', error)
    return errorResponse(
      502,
      'upstream_error',
      'The assistant is unavailable right now. Please try again later.'
    )
  }
}
