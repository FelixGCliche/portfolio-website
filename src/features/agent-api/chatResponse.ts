import {
  chat,
  chatParamsFromRequestBody,
  EventType,
  maxIterations,
  type StreamChunk,
  toServerSentEventsResponse,
} from '@tanstack/ai'
import { createOpenRouterText } from '@tanstack/ai-openrouter'

import { agentTools } from '@features/agent'

import { type ChatRequest, localeFromRequest } from './chatRequest'
import { errorResponse, INVALID_REQUEST_MESSAGE } from './errors'
import { systemPromptFor } from './systemPrompt'

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

const UNAVAILABLE_MESSAGE = 'The assistant is unavailable right now. Please try again later.'

/** Names of the tools the model may call, used to validate tool calls replayed by the client. */
export const agentToolNames: readonly string[] = agentTools.map((tool) => tool.name)

const upstreamRunError = (chunk?: StreamChunk): StreamChunk => ({
  ...(chunk?.type === EventType.RUN_ERROR ? chunk : {}),
  type: EventType.RUN_ERROR,
  timestamp: Date.now(),
  message: UNAVAILABLE_MESSAGE,
  code: 'upstream_error',
  error: { message: UNAVAILABLE_MESSAGE, code: 'upstream_error' },
})

/**
 * Ends the run with one generic `RUN_ERROR` whether the upstream failure arrives as a `RUN_ERROR`
 * chunk or as an error thrown mid-stream, logging the original and keeping provider details off the
 * wire.
 */
const withCleanErrors = async function* (stream: AsyncIterable<StreamChunk>, signal: AbortSignal) {
  try {
    for await (const chunk of stream) {
      if (chunk.type === EventType.RUN_ERROR) {
        console.error('[agent] run failed', chunk.error ?? chunk.message)
        yield upstreamRunError(chunk)
        return
      }
      yield chunk
    }
  } catch (error) {
    if (signal.aborted) return
    console.error('[agent] stream failed', error)
    yield upstreamRunError()
  }
}

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
    return errorResponse(400, 'invalid_request', INVALID_REQUEST_MESSAGE)
  }

  // Forward the client disconnect, including one that happened before this point.
  const abortController = new AbortController()
  if (signal?.aborted) abortController.abort(signal.reason)
  else signal?.addEventListener('abort', () => abortController.abort(signal.reason), { once: true })

  // Only setup errors are caught here; failures while streaming become a RUN_ERROR event.
  try {
    const stream = chat({
      adapter: createOpenRouterText(AGENT_MODEL, apiKey),
      messages: params.messages,
      systemPrompts: [systemPromptFor(localeFromRequest(input))],
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
    return toServerSentEventsResponse(withCleanErrors(stream, abortController.signal), {
      abortController,
    })
  } catch (error) {
    console.error('[agent] failed to start chat', error)
    return errorResponse(502, 'upstream_error', UNAVAILABLE_MESSAGE)
  }
}
