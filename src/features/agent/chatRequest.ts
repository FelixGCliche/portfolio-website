import { z } from 'zod'

/** Largest accepted request body, in bytes. */
export const MAX_BODY_BYTES = 64 * 1024
/** Most messages (history included) accepted in one request. */
export const MAX_MESSAGES = 40
/** Longest accepted text for a single user message, in characters. */
export const MAX_USER_MESSAGE_CHARS = 2000

const idSchema = z.string().min(1).max(128)

// Roles the client may send. `system`/`developer` are rejected so the browser can't override the
// server's system prompt.
const messageSchema = z.discriminatedUnion('role', [
  z.looseObject({
    id: idSchema,
    role: z.literal('user'),
    content: z.string().trim().min(1).max(MAX_USER_MESSAGE_CHARS),
  }),
  z.looseObject({ id: idSchema, role: z.literal('assistant') }),
  z.looseObject({ id: idSchema, role: z.literal('tool') }),
  z.looseObject({ id: idSchema, role: z.literal('reasoning') }),
])

/** AG-UI `RunAgentInput` envelope as sent by `@tanstack/ai-client`'s `fetchServerSentEvents`. */
export const chatRequestSchema = z.looseObject({
  threadId: idSchema,
  runId: idSchema,
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  forwardedProps: z.record(z.string(), z.unknown()).optional(),
})

export type ChatRequest = z.infer<typeof chatRequestSchema>

export type ChatRequestErrorCode = 'payload_too_large' | 'invalid_json' | 'invalid_request'

export type ChatRequestResult =
  | { ok: true; data: ChatRequest }
  | { ok: false; status: 400 | 413; code: ChatRequestErrorCode; message: string }

/** Size-checks, parses and validates a raw chat request body. Pure, so it is unit-testable. */
export const parseChatRequest = (raw: string): ChatRequestResult => {
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      code: 'payload_too_large',
      message: 'The conversation is too long. Please start a new one.',
    }
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return {
      ok: false,
      status: 400,
      code: 'invalid_json',
      message: 'The request body is not valid JSON.',
    }
  }

  const result = chatRequestSchema.safeParse(json)
  if (!result.success) {
    return {
      ok: false,
      status: 400,
      code: 'invalid_request',
      message: 'The request is not a valid chat message.',
    }
  }

  return { ok: true, data: result.data }
}
