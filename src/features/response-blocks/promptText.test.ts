import { describe, expect, test } from 'bun:test'

import { isTypableCommand } from './promptText'

describe('isTypableCommand', () => {
  test('accepts single-line ASCII slash commands', () => {
    expect(isTypableCommand('/about')).toBe(true)
    expect(isTypableCommand('/contact')).toBe(true)
  })

  test('rejects free text, spaces, line breaks and non-ASCII', () => {
    expect(isTypableCommand('about')).toBe(false)
    expect(isTypableCommand('/')).toBe(false)
    expect(isTypableCommand('/about me')).toBe(false)
    expect(isTypableCommand('/about\n/work')).toBe(false)
    expect(isTypableCommand('/café')).toBe(false)
  })
})
