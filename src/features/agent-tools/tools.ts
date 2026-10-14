import { type AnyTool, toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

import { MAX_BLOCKS, renderBlocksInputSchema } from '@features/block-schema'
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

/** Shows rich UI blocks (tables, timelines, facts, links…) inline in the agent's reply. */
export const renderBlocksTool = toolDefinition({
  name: 'render_blocks',
  description: [
    `Show up to ${MAX_BLOCKS} rich UI blocks inline in your reply, in order. Use it for structured answers instead of long text:`,
    'a table to compare things (e.g. two roles side by side);',
    'keyValue for quick facts (location, status, years of experience);',
    'timeline for roles or education over time;',
    'toolRows for skills grouped by area, or tags for a short list of technologies;',
    'list for a few highlights; heading to title a group of blocks; prose for a short paragraph;',
    'links only for outbound contact links, and only the GitHub and LinkedIn URLs or a mailto: link to the profile email;',
    'next to suggest 1 to 3 site topics to open next.',
    'Only use facts from the portfolio content and never include the phone number. The blocks are shown as soon as the tool is called; do not repeat their content in text.',
  ].join(' '),
  inputSchema: renderBlocksInputSchema,
  outputSchema: z.object({ status: z.literal('rendered'), count: z.number() }),
})

/**
 * `render_blocks` runs on the server as a no-op: the blocks are rendered from the streamed tool
 * call arguments, so the server answers the call inline and the browser needs no round-trip.
 */
export const renderBlocksServerTool = renderBlocksTool.server(({ blocks }) => ({
  status: 'rendered' as const,
  count: blocks.length,
}))

/**
 * Tools passed to the model by the chat route. The UI tools have no `execute`, so their calls are
 * forwarded to the browser, which runs the `.client()` implementations from `createClientTools`;
 * `render_blocks` is answered on the server.
 */
export const agentTools: ReadonlyArray<AnyTool> = [
  showTopicTool,
  setThemeTool,
  setLanguageTool,
  renderBlocksServerTool,
]
