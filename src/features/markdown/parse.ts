import { classifyHref, type SafeHref } from '@features/safe-links'

// A link always carries a safe, classified href; unsafe links are flattened to their label
export type MdLink = { type: 'link'; children: MdInline[] } & SafeHref

export type MdInline =
  | { type: 'text'; text: string }
  | { type: 'strong' | 'em'; children: MdInline[] }
  | { type: 'code'; text: string }
  | MdLink

export type MdList =
  | { type: 'list'; ordered: false; items: MdListItem[] }
  | { type: 'list'; ordered: true; start: number; items: MdListItem[] }

// `children` is the item's sub-list; the parser nests one level deep
export type MdListItem = { inlines: MdInline[]; children?: MdList }

export type MdBlock = { type: 'paragraph'; inlines: MdInline[] } | MdList

const LIST_ITEM = /^\s*(?:([-*•])|(\d{1,9})[.)])\s+(\S.*)$/
// A list marker with no content yet: held back while it is the last (streaming) line
const BARE_MARKER = /^\s*(?:[-*•]|\d{1,9}[.)])\s*$/
const HEADING = /^\s*#{1,6}\s+(.*?)(?:\s+#+)?\s*$/
const WORD_CHAR = /[\p{L}\p{N}]/u
const PUNCTUATION = /[!-/:-@[-`{-~]/
// Characters that can start inline syntax; anything between them is plain text
const SPECIAL = /[\\`*_[]/g

// A marker indented this far past its list's own markers starts (or continues) a sub-list
const NEST_INDENT = 2

const indentOf = (line: string) => {
  let width = 0
  for (const char of line) {
    if (char === ' ') width++
    else if (char === '\t') width += 4 - (width % 4)
    else break
  }
  return width
}

const isSpace = (char: string | undefined) => char === undefined || /\s/.test(char)
const isWord = (char: string | undefined) => char !== undefined && WORD_CHAR.test(char)
const isEscape = (text: string, index: number) =>
  text[index] === '\\' && PUNCTUATION.test(text[index + 1] ?? '')

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

/**
 * Scans the code span opening at `open`: `ticks` is the backtick run's length and `close` the
 * start of the matching run (one not followed by another backtick), or -1 when it is unclosed.
 */
const scanCode = (text: string, open: number) => {
  const ticks = runLength(text, open, '`')
  const fence = '`'.repeat(ticks)
  let close = text.indexOf(fence, open + ticks)
  while (close !== -1 && text[close + ticks] === '`') close = text.indexOf(fence, close + 1)
  return { ticks, close, end: close === -1 ? open + ticks : close + ticks }
}

/**
 * For each `[` and `(` in `text`, the index of the bracket closing it, or -1. Built in one pass so
 * that link scans stay linear even with many unmatched brackets (as while a reply streams).
 */
const matchBrackets = (text: string) => {
  const match = new Int32Array(text.length).fill(-1)
  const square: number[] = []
  const round: number[] = []
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (char === '\\') index++
    else if (char === '[') square.push(index)
    else if (char === '(') round.push(index)
    else if (char === ']' && square.length > 0) match[square.pop() as number] = index
    else if (char === ')' && round.length > 0) match[round.pop() as number] = index
  }
  return match
}

/** For a complete `[label](href)` starting at `open`, the indexes of its `]` and `)`. */
const scanLink = (text: string, open: number, brackets: Int32Array) => {
  const labelEnd = brackets[open]
  if (labelEnd === -1 || text[labelEnd + 1] !== '(') return undefined
  const hrefEnd = brackets[labelEnd + 1]
  return hrefEnd === -1 ? undefined : { labelEnd, hrefEnd }
}

type Scanner = {
  text: string
  // Undefined inside a link label, where links do not nest
  link: (open: number) => ReturnType<typeof scanLink>
}

const scannerFor = (text: string, allowLinks: boolean): Scanner => {
  let brackets: Int32Array | undefined
  return {
    text,
    link: (open) =>
      allowLinks && text[open] === '['
        ? scanLink(text, open, (brackets ??= matchBrackets(text)))
        : undefined,
  }
}

/**
 * Finds where the emphasis closing `size` delimiters starts, or -1. A closer is a run of the
 * marker that follows non-space content; strong (size 2) takes the last two of a run of two or
 * more, em (size 1) takes a lone marker or the last of a run of three or more. Escaped characters,
 * code spans and whole links are skipped, as `parseInlines` consumes them first.
 */
const findCloser = (scanner: Scanner, from: number, marker: string, size: number) => {
  const { text } = scanner
  let index = from
  while (index < text.length) {
    if (isEscape(text, index)) {
      index += 2
      continue
    }
    if (text[index] === '`') {
      index = scanCode(text, index).end
      continue
    }
    const link = scanner.link(index)
    if (link) {
      index = link.hrefEnd + 1
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
  const scanner = scannerFor(text, allowLinks)
  let index = 0
  while (index < text.length) {
    const char = text[index]
    const link = scanner.link(index)
    if (isEscape(text, index)) {
      pushText(out, text[index + 1])
      index += 2
    } else if (char === '`') {
      const { ticks, close, end } = scanCode(text, index)
      if (close === -1) {
        pushText(out, '`'.repeat(ticks))
      } else {
        const raw = text.slice(index + ticks, close)
        const padded = raw.length > 2 && raw.startsWith(' ') && raw.endsWith(' ')
        out.push({ type: 'code', text: padded ? raw.slice(1, -1) : raw })
      }
      index = end
    } else if (char === '*' || char === '_') {
      const length = runLength(text, index, char)
      const size = length >= 2 ? 2 : 1
      const opens = !isSpace(text[index + length]) && (char !== '_' || !isWord(text[index - 1]))
      const close = opens ? findCloser(scanner, index + size, char, size) : -1
      if (close === -1) {
        pushText(out, char.repeat(length))
        index += length
      } else {
        const children = parseInlines(text.slice(index + size, close), allowLinks)
        out.push({ type: size === 2 ? 'strong' : 'em', children })
        index = close + size
      }
    } else if (link) {
      const label = text.slice(index + 1, link.labelEnd)
      const href = text.slice(link.labelEnd + 2, link.hrefEnd).trim()
      const safe = classifyHref(href)
      // An empty label falls back to a safe href so the link stays visible; otherwise it drops
      const children: MdInline[] = label.trim()
        ? parseInlines(label, false)
        : safe
          ? [{ type: 'text', text: href }]
          : []
      if (safe) out.push({ type: 'link', ...safe, children })
      else
        for (const child of children) {
          if (child.type === 'text') pushText(out, child.text)
          else out.push(child)
        }
      index = link.hrefEnd + 1
    } else {
      SPECIAL.lastIndex = index + 1
      const next = SPECIAL.exec(text)?.index ?? text.length
      pushText(out, text.slice(index, next))
      index = next
    }
  }
  return out
}

type PendingList = { ordered: boolean; start: number; items: PendingItem[] }
type PendingItem = { text: string; children?: PendingList }
type Pending =
  | { type: 'paragraph'; lines: string[] }
  | ({ type: 'list'; indent: number } & PendingList)

const toList = (list: PendingList): MdList => {
  const items = list.items.map((item): MdListItem => {
    const inlines = parseInlines(item.text)
    return item.children ? { inlines, children: toList(item.children) } : { inlines }
  })
  return list.ordered
    ? { type: 'list', ordered: true, start: list.start, items }
    : { type: 'list', ordered: false, items }
}

/**
 * Parses the light markdown the agent writes: paragraphs, lists and headings (shown as a bold
 * paragraph), with code, strong, em and allowlisted links inline. Lists nest one level: a marker
 * indented at least two columns past its list's markers becomes a sub-item of the item above it;
 * deeper markers join that same sub-list, whose kind (ordered or not) is set by its first marker.
 * It is safe to call on every prefix of a streaming reply: unclosed markers stay literal and only
 * complete, safe hrefs become links. Raw HTML is plain text.
 */
export const parseMarkdown = (src: string): MdBlock[] => {
  const blocks: MdBlock[] = []
  let pending: Pending | undefined

  const flush = () => {
    if (pending?.type === 'paragraph') {
      blocks.push({ type: 'paragraph', inlines: parseInlines(pending.lines.join('\n')) })
    } else if (pending?.type === 'list') {
      blocks.push(toList(pending))
    }
    pending = undefined
  }

  const lines = String(src ?? '').split(/\r\n?|\n/)
  const nests = (line: string) =>
    pending?.type === 'list' && indentOf(line) >= pending.indent + NEST_INDENT
  // A blank line keeps a list open when the next non-blank line is a sub-item or an item of the
  // same kind
  const continuesList = (from: number) => {
    if (pending?.type !== 'list') return false
    for (let index = from + 1; index < lines.length; index++) {
      const next = lines[index]
      if (!next.trim()) continue
      const item = LIST_ITEM.exec(next)
      return item !== null && (nests(next) || (item[2] !== undefined) === pending.ordered)
    }
    return false
  }

  for (const [index, line] of lines.entries()) {
    if (!line.trim()) {
      if (!continuesList(index)) flush()
      continue
    }
    // A bare last marker emits nothing until content arrives, so it never flickers between
    // paragraph and list
    if (index === lines.length - 1 && BARE_MARKER.test(line)) continue

    const heading = HEADING.exec(line)
    if (heading) {
      flush()
      blocks.push({
        type: 'paragraph',
        inlines: [{ type: 'strong', children: parseInlines(heading[1]) }],
      })
      continue
    }

    const item = LIST_ITEM.exec(line)
    if (item) {
      const ordered = item[2] !== undefined
      const start = ordered ? Number(item[2]) : 1
      const parent = pending?.type === 'list' && nests(line) ? pending.items.at(-1) : undefined
      let list: PendingList
      if (parent) {
        list = parent.children ??= { ordered, start, items: [] }
      } else {
        if (pending?.type !== 'list' || pending.ordered !== ordered) {
          flush()
          pending = { type: 'list', indent: indentOf(line), ordered, start, items: [] }
        }
        list = pending
      }
      list.items.push({ text: item[3].trim() })
    } else if (pending?.type === 'list' && /^\s/.test(line)) {
      // A continuation line joins the last item, or the last sub-item when it has one
      const last = pending.items.at(-1)
      const target = last?.children?.items.at(-1) ?? last
      if (target) target.text += `\n${line.trim()}`
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
