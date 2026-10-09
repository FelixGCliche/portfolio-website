import { untrack } from 'solid-js'
import type { Accessor } from 'solid-js'
import { z } from 'zod'

import type { Locale } from '@features/locales'
import type { Theme } from '@features/themes'
import type { TopicKey } from '@features/topic-keys'

import { setLanguageTool, setThemeTool, showTopicTool } from './tools'

/** The app state and actions the agent's UI tools drive, injected so this module stays provider-free. */
export type ClientToolActions = {
  /** Shows a topic in the conversation (ConversationProvider's `run`). */
  run: (key: TopicKey) => void
  theme: Accessor<Theme>
  setTheme: (theme: Theme) => void
  locale: Accessor<Locale>
  setLocale: (locale: Locale) => void
  /**
   * Identifies the visitor request in flight (e.g. the chat turn id). Repeated identical calls
   * within one request are ignored, so the model cannot replay an action in a loop.
   */
  requestId: Accessor<string | undefined>
}

type Status = 'applied' | 'unchanged'

/**
 * Validates model-supplied arguments, then runs `apply`. Handlers are async, so a validation or
 * action failure rejects and `@tanstack/ai-client` reports it back to the model as an
 * `output-error` tool result carrying the error message.
 */
const handle = async <TSchema extends z.ZodType, TOutput>(
  toolName: string,
  schema: TSchema,
  args: unknown,
  apply: (input: z.output<TSchema>) => TOutput
): Promise<TOutput> => {
  const parsed = schema.safeParse(args)
  if (!parsed.success)
    throw new Error(`Invalid ${toolName} arguments: ${z.prettifyError(parsed.error)}`)
  try {
    return apply(parsed.data)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`${toolName} failed: ${reason}`, { cause: error })
  }
}

/**
 * Browser implementations of the agent's UI tools. Arguments come from the model, so each one is
 * re-validated against its schema before an action runs. Calls that would not change anything
 * skip the action and report `status: 'unchanged'`: a repeat of an identical call within the same
 * request, or switching to the theme or language the site already uses.
 */
export const createClientTools = ({
  run,
  theme,
  setTheme,
  locale,
  setLocale,
  requestId,
}: ClientToolActions) => {
  // Calls already applied for the latest request, keyed by tool name and arguments.
  let applied: { requestId: string | undefined; calls: Set<string> } = {
    requestId: undefined,
    calls: new Set(),
  }

  // Runs `action` unless an identical call was already applied for the current request. A failed
  // action is not recorded, so the model may retry it.
  const once = (call: string, action: () => void): Status => {
    const current = untrack(requestId)
    if (applied.requestId !== current) applied = { requestId: current, calls: new Set() }
    if (applied.calls.has(call)) return 'unchanged'
    action()
    applied.calls.add(call)
    return 'applied'
  }

  return [
    showTopicTool.client((args) =>
      handle(showTopicTool.name, showTopicTool.inputSchema, args, ({ key }) => ({
        key,
        status: once(`${showTopicTool.name}:${key}`, () => run(key)),
      }))
    ),
    setThemeTool.client((args) =>
      handle(setThemeTool.name, setThemeTool.inputSchema, args, ({ theme: next }) => ({
        theme: next,
        status:
          untrack(theme) === next
            ? 'unchanged'
            : once(`${setThemeTool.name}:${next}`, () => setTheme(next)),
      }))
    ),
    setLanguageTool.client((args) =>
      handle(setLanguageTool.name, setLanguageTool.inputSchema, args, ({ language }) => ({
        language,
        status:
          untrack(locale) === language
            ? 'unchanged'
            : once(`${setLanguageTool.name}:${language}`, () => setLocale(language)),
      }))
    ),
  ] as const
}
