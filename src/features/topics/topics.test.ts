import { describe, expect, test } from 'bun:test'

import { resolveInput } from './topics'

const COMMANDS = ['/about', '/theme', '/clear']

// Exact key lookup: resolveInput is responsible for normalizing what it passes in
const find = (key: string) => COMMANDS.find((command) => command === key)

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

  test('resolves a mixed-case slash command', () => {
    expect(resolveInput('/THEME', find)).toEqual({
      kind: 'command',
      command: '/theme',
      raw: '/THEME',
    })
  })

  test.each(['clear', 'About', 'theme'])('sends the bare command word %p to the agent', (text) => {
    expect(resolveInput(text, find)).toEqual({ kind: 'ask', raw: text })
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

  test('passes the finder only normalized slash keys', () => {
    const seen: string[] = []
    const spy = (key: string) => {
      seen.push(key)
      return find(key)
    }
    resolveInput('  ', spy)
    resolveInput('clear', spy)
    resolveInput('what is this?', spy)
    resolveInput('  /About ', spy)
    expect(seen).toEqual(['/about'])
  })
})
