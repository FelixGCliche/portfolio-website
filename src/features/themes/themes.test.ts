import { describe, expect, test } from 'bun:test'

import { isTheme, THEMES } from './themes'

describe('isTheme', () => {
  test('accepts every theme', () => {
    for (const theme of THEMES) expect(isTheme(theme)).toBe(true)
  })

  test('rejects anything else', () => {
    expect(isTheme('blue')).toBe(false)
    expect(isTheme(undefined)).toBe(false)
    expect(isTheme(null)).toBe(false)
  })
})
