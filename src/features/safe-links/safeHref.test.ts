import { describe, expect, test } from 'bun:test'

import { profile } from '@content'

import { TOPIC_KEYS } from '@features/topic-keys'

import { isSafeHref, isTopicHref } from './safeHref'

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
})
