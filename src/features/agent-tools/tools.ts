import { type AnyTool, toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

import { LOCALE_NAMES, LOCALES } from '@features/locales'
import { THEMES } from '@features/themes'
import { TOPIC_KEYS } from '@features/topic-keys'

/** Whether a UI tool call changed the site, or asked for what the site already shows. */
const statusSchema = z.enum(['applied', 'unchanged'])

/** Opens one of the site's topics in the conversation, as if the visitor typed its command. */
export const showTopicTool = toolDefinition({
  name: 'show_topic',
  description: `Show one of the site topics to the visitor (the same as typing its command, e.g. ${TOPIC_KEYS[0]}). Use it when the visitor asks to see, open or go to a topic, or when a topic page answers their question better than a summary. Add at most a short sentence alongside it.`,
  inputSchema: z.object({
    key: z.enum(TOPIC_KEYS).describe(`The topic to show, one of: ${TOPIC_KEYS.join(', ')}.`),
  }),
  outputSchema: z.object({ key: z.enum(TOPIC_KEYS), status: statusSchema }),
})

/** Switches the site's colour theme. */
export const setThemeTool = toolDefinition({
  name: 'set_theme',
  description: `Switch the site's colour theme (${THEMES.join(' or ')}). Use it only when the visitor asks for a theme change.`,
  inputSchema: z.object({
    theme: z.enum(THEMES).describe(`The theme to switch to, one of: ${THEMES.join(', ')}.`),
  }),
  outputSchema: z.object({ theme: z.enum(THEMES), status: statusSchema }),
})

/** Switches the site's language. */
export const setLanguageTool = toolDefinition({
  name: 'set_language',
  description: `Switch the site's language (${LOCALES.join(' or ')}). Use it only when the visitor asks to change the site language, then continue in that language.`,
  inputSchema: z.object({
    language: z
      .enum(LOCALES)
      .describe(
        `The language code to switch to, one of: ${LOCALES.map((locale) => `${locale} (${LOCALE_NAMES[locale]})`).join(', ')}.`
      ),
  }),
  outputSchema: z.object({ language: z.enum(LOCALES), status: statusSchema }),
})

/**
 * Tool definitions shared by the chat route and the client. The server passes them to the model
 * without an `execute`, so calls are forwarded to the browser, which runs the `.client()`
 * implementations from `createClientTools`.
 */
export const agentTools: ReadonlyArray<AnyTool> = [showTopicTool, setThemeTool, setLanguageTool]
