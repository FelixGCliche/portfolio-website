import { isSafeHref } from '@features/safe-links'

export type MdInline =
  | { type: 'text'; text: string }
  | { type: 'strong' | 'em'; children: MdInline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: MdInline[] }

export type MdBlock =
  | { type: 'paragraph'; inlines: MdInline[] }
  | { type: 'list'; ordered: false; items: MdInline[][] }
  | { type: 'list'; ordered: true; start: number; items: MdInline[][] }

const LIST_ITEM = /^\s*(?:([-*•])|(\d{1,9})[.)])\s+(.*)$/
const HEADING = /^\s*#{1,6}\s+(.*?)(?:\s+#+)?\s*$/
const WORD_CHAR = /[\p{L}\p{N}]/u
const PUNCTUATION = /[!-/:-@[-`{-~]/

const isSpace = (char: string | undefined) => char === undefined || /\s/.test(char)
const isWord = (char: string | undefined) => char !== undefined && WORD_CHAR.test(char)

const runLength = (text: string, from: number, char: string) => {
  let end = from
  while (text[end] === char) end++
  return end - from
}

const pushText = (out: MdInline[], text: string) => {
  if (!text) return
  const last = out.at(-1)
  if (last?.type === 'text') last.text += text
  else out.push({ type: 'text', text })
}

/** Finds the bracket closing the one at `open` (`[` or `(`), or -1. */
const findMatching = (text: string, open: number) => {
  const [opener, closer] = text[open] === '[' ? ['[', ']'] : ['(', ')']
  let depth = 0
  for (let index = open; index < text.length; index++) {
    if (text[index] === '\\') index++
    else if (text[index] === opener) depth++
    else if (text[index] === closer && --depth === 0) return index
  }
  return -1
}

/** For a complete `[label](href)` starting at `open`, the indexes of `]` and `)`; otherwise -1s. */
const findLink = (text: string, open: number) => {
  const labelEnd = findMatching(text, open)
  const hrefEnd =
    labelEnd !== -1 && text[labelEnd + 1] === '(' ? findMatching(text, labelEnd + 1) : -1
  return { labelEnd, hrefEnd }
}

/**
 * Finds where the emphasis closing `size` delimiters starts, or -1. A closer is a run of the
 * marker that follows non-space content; strong (size 2) takes the last two of a run of two or
 * more, em (size 1) takes a lone marker or the last of a run of three or more. Escaped characters,
 * code spans and (when `allowLinks`) whole links are skipped, as `parseInlines` consumes them first.
 */
const findCloser = (
  text: string,
  from: number,
  marker: string,
  size: number,
  allowLinks: boolean
) => {
  let index = from
  while (index < text.length) {
    if (text[index] === '\\' && PUNCTUATION.test(text[index + 1] ?? '')) {
      index += 2
      continue
    }
    if (text[index] === '`') {
      const ticks = runLength(text, index, '`')
      const close = text.indexOf('`'.repeat(ticks), index + ticks)
      index = close === -1 ? index + ticks : close + ticks
      continue
    }
    if (text[index] === '[' && allowLinks) {
      const { hrefEnd } = findLink(text, index)
      index = hrefEnd === -1 ? index + 1 : hrefEnd + 1
      continue
    }
    if (text[index] !== marker) {
      index++
      continue
    }
    const length = runLength(text, index, marker)
    const end = index + length
    const fits = size === 2 ? length >= 2 : length !== 2
    const flanked = index > from && !isSpace(text[index - 1])
    const bounded = marker !== '_' || !isWord(text[end])
    if (fits && flanked && bounded) return end - size
    index = end
  }
  return -1
}

const parseInlines = (text: string, allowLinks = true): MdInline[] => {
  const out: MdInline[] = []
  let index = 0
  while (index < text.length) {
    const char = text[index]
    if (char === '\\' && PUNCTUATION.test(text[index + 1] ?? '')) {
      pushText(out, text[index + 1])
      index += 2
    } else if (char === '`') {
      const ticks = runLength(text, index, '`')
      const fence = '`'.repeat(ticks)
      let close = text.indexOf(fence, index + ticks)
      while (close !== -1 && text[close + ticks] === '`') close = text.indexOf(fence, close + 1)
      if (close === -1) {
        pushText(out, fence)
      } else {
        const raw = text.slice(index + ticks, close)
        const padded = raw.length > 2 && raw.startsWith(' ') && raw.endsWith(' ')
        out.push({ type: 'code', text: padded ? raw.slice(1, -1) : raw })
      }
      index = close === -1 ? index + ticks : close + ticks
    } else if (char === '*' || char === '_') {
      const length = runLength(text, index, char)
      const size = length >= 2 ? 2 : 1
      const opens = !isSpace(text[index + length]) && (char !== '_' || !isWord(text[index - 1]))
      const close = opens ? findCloser(text, index + size, char, size, allowLinks) : -1
      if (close === -1) {
        pushText(out, char.repeat(length))
        index += length
      } else {
        const children = parseInlines(text.slice(index + size, close), allowLinks)
        out.push({ type: size === 2 ? 'strong' : 'em', children })
        index = close + size
      }
    } else if (char === '[' && allowLinks) {
      const { labelEnd, hrefEnd } = findLink(text, index)
      if (hrefEnd === -1) {
        pushText(out, char)
        index++
      } else {
        const children = parseInlines(text.slice(index + 1, labelEnd), false)
        const href = text.slice(labelEnd + 2, hrefEnd).trim()
        if (isSafeHref(href)) out.push({ type: 'link', href, children })
        else
          for (const child of children) {
            if (child.type === 'text') pushText(out, child.text)
            else out.push(child)
          }
        index = hrefEnd + 1
      }
    } else {
      pushText(out, char)
      index++
    }
  }
  return out
}

type Pending =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'list'; ordered: boolean; start: number; items: string[] }

/**
 * Parses the light markdown the agent writes: paragraphs, single-level lists and headings (shown
 * as a bold paragraph), with code, strong, em and allowlisted links inline. It is safe to call on
 * every prefix of a streaming reply: unclosed markers stay literal and only complete, safe hrefs
 * become links. Raw HTML is plain text.
 */
export const parseMarkdown = (src: string): MdBlock[] => {
  const blocks: MdBlock[] = []
  let pending: Pending | undefined

  const flush = () => {
    if (pending?.type === 'paragraph') {
      blocks.push({ type: 'paragraph', inlines: parseInlines(pending.lines.join('\n')) })
    } else if (pending?.type === 'list') {
      const items = pending.items.map((item) => parseInlines(item))
      blocks.push(
        pending.ordered
          ? { type: 'list', ordered: true, start: pending.start, items }
          : { type: 'list', ordered: false, items }
      )
    }
    pending = undefined
  }

  const lines = String(src ?? '').split(/\r\n?|\n/)
  // A blank line keeps a list open when the next non-blank line is an item of the same kind
  const continuesList = (from: number) => {
    if (pending?.type !== 'list') return false
    const next = lines.slice(from + 1).find((line) => line.trim())
    const item = next === undefined ? null : LIST_ITEM.exec(next)
    return item !== null && (item[2] !== undefined) === pending.ordered
  }

  for (const [index, line] of lines.entries()) {
    const heading = HEADING.exec(line)
    const item = LIST_ITEM.exec(line)
    if (!line.trim()) {
      if (!continuesList(index)) flush()
    } else if (heading) {
      flush()
      blocks.push({
        type: 'paragraph',
        inlines: [{ type: 'strong', children: parseInlines(heading[1]) }],
      })
    } else if (item) {
      const ordered = item[2] !== undefined
      if (pending?.type !== 'list' || pending.ordered !== ordered) {
        flush()
        pending = { type: 'list', ordered, start: ordered ? Number(item[2]) : 1, items: [] }
      }
      pending.items.push(item[3].trim())
    } else if (pending?.type === 'list' && /^\s/.test(line)) {
      pending.items[pending.items.length - 1] += `\n${line.trim()}`
    } else {
      if (pending?.type !== 'paragraph') {
        flush()
        pending = { type: 'paragraph', lines: [] }
      }
      pending.lines.push(line.trim())
    }
  }
  flush()
  return blocks
}
