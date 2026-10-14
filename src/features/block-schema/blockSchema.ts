import { z } from 'zod'

import { isSafeHref, isTopicHref } from '@features/safe-links'
import { TOPIC_KEYS } from '@features/topic-keys'

/** The most blocks one `render_blocks` call may show. */
export const MAX_BLOCKS = 6

/** A trimmed, non-empty string of at most `max` characters. */
const text = (max: number) => z.string().trim().min(1).max(max)

const successTone = z
  .enum(['success'])
  .describe('Optional. "success" shows the value in the accent colour.')

const headingBlock = z.object({
  type: z.literal('heading').describe('A short section header.'),
  label: text(80).describe('Header title, at most 80 characters.'),
  meta: text(60)
    .optional()
    .describe('Optional short note shown at the right, such as a date range or status.'),
  metaTone: successTone.optional(),
})

const proseBlock = z.object({
  type: z.literal('prose').describe('A paragraph of text.'),
  text: text(600).describe(
    'The text, at most 600 characters. Light markdown is allowed: **bold**, *italic*, `code`, [label](/topic) links and "- " lists.'
  ),
  tone: z
    .enum(['lead', 'body', 'quote'])
    .optional()
    .describe(
      'Optional. "lead" for a larger intro sentence, "body" (default) for normal text, "quote" for a quotation.'
    ),
})

const keyValueBlock = z.object({
  type: z
    .literal('keyValue')
    .describe('Label and value pairs, such as contact details or quick facts.'),
  rows: z
    .array(
      z.object({
        key: text(30).describe('Label, at most 30 characters.'),
        value: text(120).describe('Value, at most 120 characters.'),
        tone: successTone.optional(),
      })
    )
    .min(1)
    .max(8)
    .describe('1 to 8 rows.'),
})

const listBlock = z.object({
  type: z.literal('list').describe('A bulleted list.'),
  items: z
    .array(text(200).describe('One item, at most 200 characters.'))
    .min(1)
    .max(8)
    .describe('1 to 8 items.'),
})

const tagsBlock = z.object({
  type: z.literal('tags').describe('Short labels shown as chips, such as technologies.'),
  items: z
    .array(text(40).describe('One tag, at most 40 characters.'))
    .min(1)
    .max(16)
    .describe('1 to 16 tags.'),
})

const tableBlock = z
  .object({
    type: z.literal('table').describe('A small table.'),
    columns: z
      .array(text(40).describe('Column header, at most 40 characters.'))
      .min(2)
      .max(4)
      .describe('2 to 4 column headers.'),
    rows: z
      .array(
        z
          .array(text(120).describe('Cell text, at most 120 characters.'))
          .describe('One row: one cell per column.')
      )
      .min(1)
      .max(10)
      .describe('1 to 10 rows, each with exactly as many cells as there are columns.'),
  })
  .superRefine((table, ctx) => {
    table.rows.forEach((row, index) => {
      if (row.length !== table.columns.length)
        ctx.addIssue({
          code: 'custom',
          path: ['rows', index],
          message: `Row has ${row.length} cells but the table has ${table.columns.length} columns`,
        })
    })
  })

const toolRowsBlock = z.object({
  type: z.literal('toolRows').describe('Tools grouped by area, such as a skills overview.'),
  rows: z
    .array(
      z.object({
        area: text(40).describe('Area name, at most 40 characters, such as "Frontend".'),
        tools: z
          .array(text(40).describe('Tool name, at most 40 characters.'))
          .min(1)
          .max(12)
          .describe('1 to 12 tools.'),
      })
    )
    .min(1)
    .max(8)
    .describe('1 to 8 areas.'),
})

const timelineBlock = z.object({
  type: z.literal('timeline').describe('Roles or education in time order.'),
  items: z
    .array(
      z.object({
        title: text(80).describe('Role or degree, at most 80 characters.'),
        company: text(80).optional().describe('Optional company or school, at most 80 characters.'),
        range: text(40).describe('Date range, at most 40 characters, such as "2021 – 2024".'),
        current: z.boolean().optional().describe('Optional. true when this is the current role.'),
        bullets: z
          .array(text(200).describe('One highlight, at most 200 characters.'))
          .max(4)
          .optional()
          .describe('Optional, up to 4 highlights.'),
      })
    )
    .min(1)
    .max(6)
    .describe('1 to 6 entries.'),
})

const linksBlock = z.object({
  type: z.literal('links').describe('External contact links, such as email, GitHub or LinkedIn.'),
  items: z
    .array(
      z.object({
        label: text(30).describe('Link name, at most 30 characters, such as "GitHub".'),
        value: text(80).describe(
          'Shown text, at most 80 characters, such as the handle or address.'
        ),
        href: z
          .string()
          .trim()
          .max(300)
          .refine(
            (href) => isSafeHref(href) && !isTopicHref(href),
            'Link is not an allowed external link'
          )
          .describe('The https GitHub or LinkedIn URL, or a mailto: link to the profile email.'),
      })
    )
    .min(1)
    .max(4)
    .describe('1 to 4 links.'),
})

const nextBlock = z.object({
  type: z.literal('next').describe('Suggested topics to open next.'),
  topics: z
    .array(z.enum(TOPIC_KEYS).describe(`A topic, one of: ${TOPIC_KEYS.join(', ')}.`))
    .min(1)
    .max(3)
    .describe('1 to 3 topics.'),
})

/** One UI block the agent can render, discriminated by `type`. */
export const blockSchema = z
  .discriminatedUnion('type', [
    headingBlock,
    proseBlock,
    keyValueBlock,
    listBlock,
    tagsBlock,
    tableBlock,
    toolRowsBlock,
    timelineBlock,
    linksBlock,
    nextBlock,
  ])
  .describe('One block; "type" selects which fields apply.')

export type Block = z.infer<typeof blockSchema>
export type BlockType = Block['type']
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>

/** Input of the `render_blocks` tool. */
export const renderBlocksInputSchema = z.object({
  blocks: z
    .array(blockSchema)
    .min(1)
    .max(MAX_BLOCKS)
    .describe(`1 to ${MAX_BLOCKS} blocks, shown in order.`),
})

export type RenderBlocksInput = z.infer<typeof renderBlocksInputSchema>

/**
 * Validates each element of a possibly partial `blocks` array on its own and keeps the valid ones
 * in order, up to `MAX_BLOCKS`. Meant for partial JSON while a tool call streams in.
 */
export const parseBlocksLenient = (value: unknown): Block[] => {
  if (!Array.isArray(value)) return []
  const blocks: Block[] = []
  for (const element of value) {
    if (blocks.length >= MAX_BLOCKS) break
    const result = blockSchema.safeParse(element)
    if (result.success) blocks.push(result.data)
  }
  return blocks
}
