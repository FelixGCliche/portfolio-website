import { projects } from '@content'

import { createHrefClassifier, projectPageUrls } from '@features/safe-links'

import { createBlockSchemas } from './blockSchema'

// The schemas the agent and the chat use, allowing the project pages listed in the content.
const contentSchemas = createBlockSchemas(
  createHrefClassifier(projectPageUrls(projects)).isSafeHref
)

/** One UI block the agent can render, discriminated by `type`. */
export const blockSchema = contentSchemas.blockSchema

/** Input of the `render_blocks` tool. */
export const renderBlocksInputSchema = contentSchemas.renderBlocksInputSchema

/** See `createBlockSchemas`; validates against the content's project pages. */
export const parseBlocksLenient = contentSchemas.parseBlocksLenient
