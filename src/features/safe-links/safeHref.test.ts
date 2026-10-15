import { describe, expect, test } from 'bun:test'

import { profile } from '@content'

import { TOPIC_KEYS } from '@features/topic-keys'

import { classifyHref, isSafeHref, isTopicHref } from './safeHref'

const email = profile[0]?.email ?? ''

describe('isTopicHref', () => {
  test.each([...TOPIC_KEYS])('accepts %s', (key) => {
    expect(isTopicHref(key)).toBe(true)
  })

  test.each(['/nope', 'about', '/about/', '/About', ''])('rejects %p', (href) => {
    expect(isTopicHref(href)).toBe(false)
  })
})

describe('isSafeHref', () => {
  test.each([
    ...TOPIC_KEYS,
    'https://github.com/FelixGCliche',
    'https://github.com/',
    'https://github.com',
    'https://GitHub.com/FelixGCliche',
    'https://linkedin.com/in/someone',
    'https://www.linkedin.com/in/someone',
    `mailto:${email}`,
    `mailto:${email.toUpperCase()}`,
    `mailto:${email}?subject=Hello%20there`,
    `mailto:${email}?subject=Hi&body=Text`,
  ])('accepts %s', (href) => {
    expect(isSafeHref(href)).toBe(true)
  })

  test.each([
    '',
    '/nope',
    '/about/../etc',
    'http://github.com/FelixGCliche',
    '//github.com/FelixGCliche',
    'https://github.com.evil.com/',
    'https://evilgithub.com/',
    'https://gist.github.com/',
    'https://linkedin.com.evil.com/',
    'https://evil.com/?https://github.com/',
    'https://user:pass@github.com/',
    'https://user@github.com/',
    'https://evil.com@github.com/',
    'https://github.com:8443/',
    'https://github.com\\@evil.com/',
    ' https://github.com/',
    'https://github.com/ ',
    'https://git\thub.com/',
    'https://github.com/\nfoo',
    `https://github${String.fromCodePoint(0x200b)}.com/`,
    `https://github.com/${String.fromCodePoint(0x202e)}evil`,
    `https://github.com/${String.fromCodePoint(0)}`,
    'HTTPS://github.com/',
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'tel:+14185550000',
    'ftp://github.com/',
    'mailto:someone@else.com',
    `mailto:${email},evil@else.com`,
    `mailto:${email}?cc=evil@else.com`,
    `mailto:${email}?bcc=evil@else.com`,
    `mailto:${email}?subject=Hi&to=evil@else.com`,
    'mailto:',
    'https://',
  ])('rejects %p', (href) => {
    expect(isSafeHref(href)).toBe(false)
  })

  test('rejects non-string input without throwing', () => {
    expect(isSafeHref(undefined as never)).toBe(false)
    expect(isSafeHref(42 as never)).toBe(false)
  })

  test.each([0x20, 0x5c, 0x7f, 0xa0, 0xad, 0x1680, 0x180e, 0x2000, 0x200f, 0x2028, 0x202f, 0x205f])(
    'rejects the unsafe range boundary code point %d',
    (code) => {
      expect(isSafeHref(`https://github.com/a${String.fromCodePoint(code)}`)).toBe(false)
    }
  )

  test('accepts characters just outside the unsafe ranges', () => {
    for (const code of [0x21, 0x5b, 0x5d, 0x7e, 0xa1, 0xac, 0xae, 0x1fff, 0x2010, 0x2030, 0x2070])
      expect(isSafeHref(`https://github.com/a${String.fromCodePoint(code)}`)).toBe(true)
  })
})

describe('classifyHref', () => {
  test('tags each safe href with its kind', () => {
    expect(classifyHref(TOPIC_KEYS[0])).toEqual({ kind: 'topic', href: TOPIC_KEYS[0] })
    expect(classifyHref('https://github.com/x')).toEqual({
      kind: 'external',
      href: 'https://github.com/x',
    })
    expect(classifyHref(`mailto:${email}`)).toEqual({ kind: 'mailto', href: `mailto:${email}` })
  })

  test('returns undefined for an unsafe href', () => {
    expect(classifyHref('javascript:alert(1)')).toBeUndefined()
    expect(classifyHref('https://evil.com/')).toBeUndefined()
  })
})
