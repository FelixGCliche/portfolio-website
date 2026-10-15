import { describe, expect, test } from 'bun:test'

import { parseMarkdown } from './parse'
import { mdToText } from './toText'

const toText = (src: string) => mdToText(parseMarkdown(src))

describe('mdToText', () => {
  test('drops inline markup and keeps the text', () => {
    expect(toText('**bold** *em* `code` [GitHub](https://github.com/x) [x](javascript:y)')).toBe(
      'bold em code GitHub x'
    )
  })

  test('separates blocks with a blank line and flattens headings', () => {
    expect(toText('# Title\nbody\nmore\n\n\n\nnext')).toBe('Title\n\nbody\nmore\n\nnext')
  })

  test('keeps list markers and indents continuations and sub-lists', () => {
    expect(toText('3. a\n   more\n   - b\n4. c')).toBe('3. a\n   more\n   - b\n4. c')
  })

  test('strips raw HTML and comments', () => {
    expect(toText('a <b>bold</b><br/> text.<!-- hidden -->\n\n<!-- gone -->')).toBe('a bold text.')
  })

  test('returns an empty string for blank input', () => {
    expect(toText(' \n\n ')).toBe('')
  })
})
