import type { AnyTool } from '@tanstack/ai'
import { toolDefinition } from '@tanstack/ai/client'
import { z } from 'zod'

// Deep imports: the i18n/topics barrels re-export JSX providers and hooks that bun test cannot load
// and the server route does not need. Preferences only contributes a type, which is erased.
import { LOCALES } from '@features/i18n/locales'
import type { Theme } from '@features/preferences'
import { TOPIC_KEYS } from '@features/topics/topic-keys'

export const THEMES = ['dark', 'light'] as const satisfies readonly Theme[]

/** Opens one of the site's topics in the conversation, as if the visitor typed its command. */
export const showTopicTool = toolDefinition({
  name: 'show_topic',
  description:
    'Show one of the site topics to the visitor (the same as typing its command, e.g. /work). Use it when the visitor asks to see, open or go to a topic, or when a topic page answers their question better than a summary.',
  inputSchema: z.object({
    key: z.enum(TOPIC_KEYS).describe('The topic to show, e.g. "/work".'),
  }),
  outputSchema: z.object({ shown: z.enum(TOPIC_KEYS) }),
})

/** Switches the site's colour theme. */
export const setThemeTool = toolDefinition({
  name: 'set_theme',
  description:
    "Switch the site's colour theme. Use it only when the visitor asks for dark mode, light mode or a theme change.",
  inputSchema: z.object({ theme: z.enum(THEMES).describe('The theme to switch to.') }),
  outputSchema: z.object({ theme: z.enum(THEMES) }),
})

/** Switches the site's language. */
export const setLanguageTool = toolDefinition({
  name: 'set_language',
  description:
    "Switch the site's language (en = English, fr = French). Use it only when the visitor asks to change the site language.",
  inputSchema: z.object({ language: z.enum(LOCALES).describe('The language to switch to.') }),
  outputSchema: z.object({ language: z.enum(LOCALES) }),
})

/**
 * Tool definitions shared by the chat route and the client. The server passes them to the model
 * without an `execute`, so calls are forwarded to the browser, which runs the `.client()`
 * implementations from `createClientTools`.
 */
export const agentTools: ReadonlyArray<AnyTool> = [showTopicTool, setThemeTool, setLanguageTool]
