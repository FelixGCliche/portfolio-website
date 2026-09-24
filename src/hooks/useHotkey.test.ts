import { afterEach, describe, expect, it, mock } from 'bun:test'

import { createRoot, flush } from 'solid-js'

import { matchesHotkey, useHotkey } from './useHotkey'
import type { HotkeyOptions } from './useHotkey'

const disposers: (() => void)[] = []

const bind = (combo: string, handler: (event: KeyboardEvent) => void, options?: HotkeyOptions) => {
  createRoot((dispose) => {
    useHotkey(combo, handler, options)
    disposers.push(dispose)
  })
  flush()
}

const keydown = (key: string, init: KeyboardEventInit = {}) =>
  new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })

const press = (key: string, init?: KeyboardEventInit, target: EventTarget = document.body) => {
  const event = keydown(key, init)
  target.dispatchEvent(event)
  return event
}

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose()
  flush()
  document.body.innerHTML = ''
})

describe('matchesHotkey', () => {
  it('maps mod to meta on Apple and ctrl elsewhere', () => {
    expect(matchesHotkey(keydown('k', { metaKey: true }), 'mod+k', true)).toBe(true)
    expect(matchesHotkey(keydown('k', { ctrlKey: true }), 'mod+k', true)).toBe(false)
    expect(matchesHotkey(keydown('k', { ctrlKey: true }), 'mod+k', false)).toBe(true)
    expect(matchesHotkey(keydown('k', { metaKey: true }), 'mod+k', false)).toBe(false)
  })

  it('requires exact modifiers', () => {
    expect(matchesHotkey(keydown('b', { ctrlKey: true, shiftKey: true }), 'ctrl+b', false)).toBe(
      false
    )
    expect(matchesHotkey(keydown('b', { ctrlKey: true, altKey: true }), 'ctrl+b', false)).toBe(
      false
    )
    expect(
      matchesHotkey(keydown('B', { ctrlKey: true, shiftKey: true }), 'ctrl+shift+b', false)
    ).toBe(true)
    expect(matchesHotkey(keydown('b'), 'ctrl+b', false)).toBe(false)
  })

  it('resolves key aliases', () => {
    expect(matchesHotkey(keydown('Escape'), 'esc', false)).toBe(true)
    expect(matchesHotkey(keydown('ArrowUp'), 'up', false)).toBe(true)
    expect(matchesHotkey(keydown('ArrowDown'), 'down', false)).toBe(true)
    expect(matchesHotkey(keydown('ArrowLeft'), 'left', false)).toBe(true)
    expect(matchesHotkey(keydown('ArrowRight'), 'right', false)).toBe(true)
    expect(matchesHotkey(keydown(' '), 'space', false)).toBe(true)
    expect(matchesHotkey(keydown('ArrowUp'), 'arrowup', false)).toBe(true)
  })
})

describe('useHotkey', () => {
  it('fires on window and prevents default', () => {
    const handler = mock()
    bind('ctrl+b', handler)
    const event = press('b', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('ignores plain keys typed in inputs', () => {
    const handler = mock()
    bind('b', handler)
    const input = document.createElement('input')
    document.body.append(input)
    const event = press('b', {}, input)
    expect(handler).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('allows mod/ctrl/meta combos in inputs', () => {
    const handler = mock()
    bind('ctrl+b', handler)
    bind('meta+b', handler)
    const textarea = document.createElement('textarea')
    document.body.append(textarea)
    press('b', { ctrlKey: true }, textarea)
    press('b', { metaKey: true }, textarea)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('allows plain keys in inputs with allowInInput', () => {
    const handler = mock()
    bind('esc', handler, { allowInInput: true })
    const input = document.createElement('input')
    document.body.append(input)
    press('Escape', {}, input)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('guards contenteditable but not contenteditable="false"', () => {
    const handler = mock()
    bind('b', handler)
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    const child = document.createElement('span')
    editable.append(child)
    const readonly = document.createElement('div')
    readonly.setAttribute('contenteditable', 'false')
    document.body.append(editable, readonly)
    press('b', {}, child)
    expect(handler).not.toHaveBeenCalled()
    press('b', {}, readonly)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('respects a reactive enabled toggle', () => {
    const handler = mock()
    let enabled = false
    bind('ctrl+b', handler, { enabled: () => enabled })
    press('b', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
    enabled = true
    press('b', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not prevent default when disabled', () => {
    bind('ctrl+b', () => {}, { enabled: () => false })
    const event = press('b', { ctrlKey: true })
    expect(event.defaultPrevented).toBe(false)
  })

  it('checks the input guard before enabled', () => {
    const enabled = mock(() => true)
    bind('b', () => {}, { enabled })
    const input = document.createElement('input')
    document.body.append(input)
    press('b', {}, input)
    press('c')
    expect(enabled).not.toHaveBeenCalled()
  })

  it('scopes to an explicit target and skips the input guard', () => {
    const handler = mock()
    const input = document.createElement('input')
    const other = document.createElement('input')
    document.body.append(input, other)
    bind('up', handler, { target: () => input })
    press('ArrowUp', {}, other)
    press('ArrowUp')
    expect(handler).not.toHaveBeenCalled()
    press('ArrowUp', {}, input)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not bind when the target is missing', () => {
    const handler = mock()
    bind('b', handler, { target: () => null })
    press('b')
    expect(handler).not.toHaveBeenCalled()
  })

  it('leaves preventDefault to the handler when disabled via option', () => {
    const handler = mock()
    bind('tab', handler, { preventDefault: false })
    const event = press('Tab')
    expect(handler).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores composing events', () => {
    const handler = mock()
    bind('enter', handler)
    press('Enter', { isComposing: true })
    expect(handler).not.toHaveBeenCalled()
  })

  it('skips a second same-key listener once default is prevented', () => {
    const first = mock()
    const second = mock()
    bind('esc', first)
    bind('esc', second)
    press('Escape')
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
  })

  it('removes the listener on dispose', () => {
    const handler = mock()
    bind('ctrl+b', handler)
    for (const dispose of disposers.splice(0)) dispose()
    flush()
    press('b', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
  })
})
