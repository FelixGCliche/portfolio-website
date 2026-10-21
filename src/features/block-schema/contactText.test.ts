import { describe, expect, test } from 'bun:test'

import { profile } from '@content'

import { containsPhoneNumber, linkTextMatchesHref } from './contactText'

const GITHUB = 'https://github.com/someone'
const MAILTO = `mailto:${profile[0]?.email ?? ''}`

describe('containsPhoneNumber', () => {
  test('does not join unrelated adjacent numbers into a profile match', () => {
    const last7 = (profile[0]?.phone ?? '').replace(/\D/g, '').slice(-7)
    const split = `${last7.slice(0, 3)} words ${last7.slice(3)}`
    expect(containsPhoneNumber(`2021 2024 ${split}`)).toBe(false)
  })

  test('still catches the profile number with odd punctuation', () => {
    const last7 = (profile[0]?.phone ?? '').replace(/\D/g, '').slice(-7)
    expect(containsPhoneNumber(`call ${last7.slice(0, 3)} - ${last7.slice(3)}`)).toBe(true)
  })
})

describe('linkTextMatchesHref', () => {
  test.each(['Vue.js', 'Node.js', 'Next.js', 'Built with Vue.js and Next.js'])(
    'accepts tech name %p',
    (text) => {
      expect(linkTextMatchesHref(text, GITHUB)).toBe(true)
    }
  )

  test.each(['example.com', 'https://other.site', 'www.other.org/x', 'example.net'])(
    'rejects mismatched address %p',
    (text) => {
      expect(linkTextMatchesHref(text, GITHUB)).toBe(false)
    }
  )

  test('accepts the href host or full URL', () => {
    expect(linkTextMatchesHref('github.com', GITHUB)).toBe(true)
    expect(linkTextMatchesHref('https://github.com/someone', GITHUB)).toBe(true)
  })

  test('mailto hrefs: recipient matches, other emails and URLs do not', () => {
    expect(linkTextMatchesHref(profile[0]?.email ?? '', MAILTO)).toBe(true)
    expect(linkTextMatchesHref('Email me', MAILTO)).toBe(true)
    expect(linkTextMatchesHref('Vue.js', MAILTO)).toBe(true)
    expect(linkTextMatchesHref('other@example.com', MAILTO)).toBe(false)
    expect(linkTextMatchesHref('example.com', MAILTO)).toBe(false)
  })
})
