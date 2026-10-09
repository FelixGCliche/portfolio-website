import { describe, expect, test } from 'bun:test'

import { normalizeInput, resolveInput } from './topics'

const COMMANDS = ['/about', '/theme', '/clear']

const find = (input: string) => {
  const key = normalizeInput(input)
  return COMMANDS.find((command) => command === key)
}

describe('resolveInput', () => {
  test.each(['', '   ', '\n\t'])('treats blank input %p as empty', (text) => {
    expect(resolveInput(text, find)).toEqual({ kind: 'empty' })
  })

  test('resolves a known slash command', () => {
    expect(resolveInput('  /about ', find)).toEqual({
      kind: 'command',
      command: '/about',
      raw: '/about',
    })
  })

  test('resolves a bare or mixed-case command name', () => {
    expect(resolveInput('About', find)).toEqual({
      kind: 'command',
      command: '/about',
      raw: 'About',
    })
    expect(resolveInput('/THEME', find)).toEqual({
      kind: 'command',
      command: '/theme',
      raw: '/THEME',
    })
  })

  test('flags an unknown slash command', () => {
    expect(resolveInput('/foo', find)).toEqual({ kind: 'unknown', raw: '/foo' })
    expect(resolveInput(' /about me ', find)).toEqual({ kind: 'unknown', raw: '/about me' })
  })

  test('sends free text to the agent', () => {
    expect(resolveInput('  what do you work on? ', find)).toEqual({
      kind: 'ask',
      raw: 'what do you work on?',
    })
    expect(resolveInput('hello', find)).toEqual({ kind: 'ask', raw: 'hello' })
  })

  test('never consults the finder for blank input', () => {
    let calls = 0
    resolveInput('  ', (input) => {
      calls++
      return find(input)
    })
    expect(calls).toBe(0)
  })
})
