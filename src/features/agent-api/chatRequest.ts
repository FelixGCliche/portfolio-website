import { z } from 'zod'

// Deep import: the i18n barrel re-exports JSX providers that bun test cannot load and the server
// route does not need.
import { DEFAULT_LOCALE, isLocale, type Locale } from '@features/i18n/locales'

import { INVALID_REQUEST_MESSAGE } from './errors'

/** Most messages (history included) accepted in one request. */
export const MAX_MESSAGES = 40
/** Longest accepted text for a single user message, in characters. */
export const MAX_USER_MESSAGE_CHARS = 2000
/** Longest accepted text for an assistant or tool message replayed from history, in characters. */
export const MAX_HISTORY_MESSAGE_CHARS = 8000
/** Longest accepted JSON arguments string for a single tool call, in characters. */
export const MAX_TOOL_ARGUMENTS_CHARS = 2000

const idSchema = z.string().min(1).max(128)

// Plain objects (not loose) so unknown fields such as client-supplied metadata are stripped before
// the history reaches the model.
const userMessageSchema = z.object({
  id: idSchema,
  role: z.literal('user'),
  content: z.string().trim().min(1).max(MAX_USER_MESSAGE_CHARS),
})

const toolMessageSchema = z.object({
  id: idSchema,
  role: z.literal('tool'),
  toolCallId: idSchema,
  content: z.string().max(MAX_HISTORY_MESSAGE_CHARS),
  error: z.string().max(MAX_HISTORY_MESSAGE_CHARS).optional(),
})

// Reasoning replayed by the client is never sent back to the model, so it is accepted and dropped.
const reasoningMessageSchema = z.object({ id: idSchema, role: z.literal('reasoning') })

/**
 * AG-UI `RunAgentInput` envelope as sent by `@tanstack/ai-client`'s `fetchServerSentEvents`.
 * `system`/`developer` messages are rejected so the browser can't override the server's system
 * prompt; tool calls must name a registered tool, and every tool result must answer a tool call
 * made earlier in the same history.
 */
export const createChatRequestSchema = (toolNames: readonly string[] = []) => {
  const assistantMessageSchema = z.object({
    id: idSchema,
    role: z.literal('assistant'),
    content: z.string().max(MAX_HISTORY_MESSAGE_CHARS).optional(),
    toolCalls: z
      .array(
        z.object({
          id: idSchema,
          type: z.literal('function'),
          function: z.object({
            // With no tools registered, no tool call can be genuine.
            name: z.string().refine((name) => toolNames.includes(name)),
            arguments: z.string().max(MAX_TOOL_ARGUMENTS_CHARS),
          }),
        })
      )
      .max(8)
      .optional(),
  })
  const messageSchema = z.discriminatedUnion('role', [
    userMessageSchema,
    assistantMessageSchema,
    toolMessageSchema,
    reasoningMessageSchema,
  ])

  return z.looseObject({
    threadId: idSchema,
    runId: idSchema,
    messages: z
      .array(messageSchema)
      .min(1)
      .max(MAX_MESSAGES)
      .superRefine((messages, ctx) => {
        const callIds = new Set<string>()
        for (const message of messages) {
          if (message.role === 'assistant') {
            for (const call of message.toolCalls ?? []) callIds.add(call.id)
          } else if (message.role === 'tool' && !callIds.has(message.toolCallId)) {
            ctx.addIssue({ code: 'custom', message: 'Tool result without a matching tool call.' })
          }
        }
        if (!messages.some((message) => message.role === 'user')) {
          ctx.addIssue({ code: 'custom', message: 'The conversation has no user message.' })
        }
      })
      .transform((messages) => messages.filter((message) => message.role !== 'reasoning')),
    forwardedProps: z.record(z.string(), z.unknown()).optional(),
  })
}

export type ChatRequest = z.infer<ReturnType<typeof createChatRequestSchema>>

export type ChatRequestErrorCode = 'invalid_json' | 'invalid_request'

/** Reads the UI locale the client forwards in `forwardedProps.locale`, defaulting when absent or unknown. */
export const localeFromRequest = (request: Pick<ChatRequest, 'forwardedProps'>): Locale => {
  const locale = request.forwardedProps?.locale
  return isLocale(locale) ? locale : DEFAULT_LOCALE
}

export type ChatRequestResult =
  | { ok: true; data: ChatRequest; locale: Locale }
  | { ok: false; status: 400; code: ChatRequestErrorCode; message: string }

// Schemas are built once per tool list; the route always passes the same list.
const schemaCache = new Map<string, ReturnType<typeof createChatRequestSchema>>()

const chatRequestSchemaFor = (toolNames: readonly string[]) => {
  const key = JSON.stringify(toolNames)
  let schema = schemaCache.get(key)
  if (!schema) {
    schema = createChatRequestSchema(toolNames)
    schemaCache.set(key, schema)
  }
  return schema
}

/**
 * Parses and validates a raw chat request body (size is enforced earlier, by `readBodyWithLimit`).
 * `toolNames` lists the tools the model may call, so tool calls in the history can be checked
 * against them. Pure, so it is unit-testable.
 */
export const parseChatRequest = (
  raw: string,
  toolNames: readonly string[] = []
): ChatRequestResult => {
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

  const result = chatRequestSchemaFor(toolNames).safeParse(json)
  if (!result.success) {
    return {
      ok: false,
      status: 400,
      code: 'invalid_request',
      message: INVALID_REQUEST_MESSAGE,
    }
  }

  return { ok: true, data: result.data, locale: localeFromRequest(result.data) }
}
