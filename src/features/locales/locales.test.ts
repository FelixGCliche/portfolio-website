import { describe, expect, test } from 'bun:test'

import { DEFAULT_LOCALE, isLocale } from './locales'

describe('isLocale', () => {
  test('accepts supported locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(true)
    expect(isLocale(DEFAULT_LOCALE)).toBe(true)
  })

  test('rejects anything else', () => {
    expect(isLocale('de')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
    expect(isLocale(42)).toBe(false)
  })
})
