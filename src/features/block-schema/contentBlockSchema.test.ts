import { describe, expect, test } from 'bun:test'

import { projects } from '@content'

import { isProjectHost, projectPageUrls } from '@features/safe-links'

import { blockSchema } from './contentBlockSchema'

describe('content blockSchema', () => {
  const pages = projectPageUrls(projects)

  test('every content project link is on a reviewed project host', () => {
    expect(pages.length).toBeGreaterThan(0)
    for (const href of pages) expect(isProjectHost(new URL(href).hostname)).toBe(true)
  })

  test('accepts each content project link', () => {
    for (const href of pages)
      expect(
        blockSchema.safeParse({ type: 'links', items: [{ label: 'Open', value: 'Open', href }] })
          .success
      ).toBe(true)
  })
})
