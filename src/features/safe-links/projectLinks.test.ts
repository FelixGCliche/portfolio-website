import { describe, expect, test } from 'bun:test'

import { videoWatchUrl } from './projectLinks'

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
