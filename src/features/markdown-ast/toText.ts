import type { MdBlock, MdInline, MdList } from './parse'

const HTML_COMMENT = /<!--[\s\S]*?(?:-->|$)/g
const HTML_TAG = /<\/?[a-z][^>]*>/gi

const inlineText = (nodes: MdInline[]): string =>
  nodes.map((node) => ('children' in node ? inlineText(node.children) : node.text)).join('')

// Raw HTML (kept as literal text by the parser) is dropped, code spans included
const runText = (nodes: MdInline[]) =>
  inlineText(nodes).replace(HTML_COMMENT, '').replace(HTML_TAG, '').trim()

// Continuation lines and sub-lists are indented under their item's text
const listLines = (list: MdList, indent = ''): string[] =>
  list.items.flatMap((item, index) => {
    const marker = list.ordered ? `${list.start + index}. ` : '- '
    const pad = indent + ' '.repeat(marker.length)
    const [first, ...rest] = runText(item.inlines).split('\n')
    return [
      `${indent}${marker}${first}`,
      ...rest.map((line) => pad + line),
      ...(item.children ? listLines(item.children, pad) : []),
    ]
  })

/**
 * Serializes parsed markdown to plain text: inline markup (emphasis, code, link targets) and raw
 * HTML are dropped, paragraphs are separated by a blank line and lists keep `-` or `N.` markers.
 */
export const mdToText = (blocks: MdBlock[]): string =>
  blocks
    .map((block) =>
      block.type === 'paragraph' ? runText(block.inlines) : listLines(block).join('\n')
    )
    .filter(Boolean)
    .join('\n\n')
