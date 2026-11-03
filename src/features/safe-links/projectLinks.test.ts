import { describe, expect, test } from 'bun:test'

import {
  isProjectHost,
  isProjectPlayUrl,
  isProjectVideoUrl,
  projectPageUrls,
  videoWatchUrl,
} from './projectLinks'

describe('videoWatchUrl', () => {
  test.each([
    ['https://www.youtube.com/embed/jmhAQYLX4fc', 'https://www.youtube.com/watch?v=jmhAQYLX4fc'],
    [
      'https://youtube.com/embed/jmhAQYLX4fc?start=3',
      'https://www.youtube.com/watch?v=jmhAQYLX4fc',
    ],
    [
      'https://www.youtube-nocookie.com/embed/abc_DEF-12',
      'https://www.youtube.com/watch?v=abc_DEF-12',
    ],
  ])('converts %s', (embed, watch) => {
    expect(videoWatchUrl(embed)).toBe(watch)
  })

  test.each([
    '',
    'not a url',
    'http://www.youtube.com/embed/jmhAQYLX4fc',
    'https://evil.com/embed/jmhAQYLX4fc',
    'https://www.youtube.com/watch?v=jmhAQYLX4fc',
    'https://www.youtube.com/embed/',
    'https://www.youtube.com/embed/jmhAQYLX4fc/extra',
    'https://www.youtube.com/embed/%22%3E',
  ])('rejects %p', (embed) => {
    expect(videoWatchUrl(embed)).toBeUndefined()
  })
})

describe('isProjectHost', () => {
  test.each(['itch.io', 'incrediboldstudio.itch.io', 'youtube.com', 'www.youtube.com', 'youtu.be'])(
    'accepts %s',
    (host) => {
      expect(isProjectHost(host)).toBe(true)
    }
  )

  test.each(['evil.com', 'itch.io.evil.com', 'evilitch.io', '-bad.itch.io', 'm.youtube.com'])(
    'rejects %s',
    (host) => {
      expect(isProjectHost(host)).toBe(false)
    }
  )
})

describe('isProjectPlayUrl', () => {
  test('accepts a plain https itch.io page', () => {
    expect(isProjectPlayUrl('https://incrediboldstudio.itch.io/stack-the-odds')).toBe(true)
  })

  test.each([
    'http://incrediboldstudio.itch.io/stack-the-odds',
    'https://user@incrediboldstudio.itch.io/stack-the-odds',
    'https://incrediboldstudio.itch.io:8443/stack-the-odds',
    'https://evil.com/stack-the-odds',
    'https://www.youtube.com/watch?v=jmhAQYLX4fc',
    'not a url',
  ])('rejects %p', (href) => {
    expect(isProjectPlayUrl(href)).toBe(false)
  })
})

describe('isProjectVideoUrl', () => {
  test('accepts a YouTube embed and rejects anything else', () => {
    expect(isProjectVideoUrl('https://www.youtube.com/embed/jmhAQYLX4fc')).toBe(true)
    expect(isProjectVideoUrl('https://www.youtube.com/watch?v=jmhAQYLX4fc')).toBe(false)
    expect(isProjectVideoUrl('https://evil.com/embed/jmhAQYLX4fc')).toBe(false)
  })
})

describe('projectPageUrls', () => {
  test('lists play pages and watch pages, dropping links off the reviewed hosts', () => {
    expect(
      projectPageUrls([
        { url: 'https://studio.itch.io/a', video: 'https://www.youtube.com/embed/jmhAQYLX4fc' },
        { url: 'https://evil.com/b', video: 'https://evil.com/embed/jmhAQYLX4fc' },
        {},
      ])
    ).toEqual(['https://studio.itch.io/a', 'https://www.youtube.com/watch?v=jmhAQYLX4fc'])
  })
})
