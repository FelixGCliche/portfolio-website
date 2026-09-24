import { createSignal, onSettled } from 'solid-js'
import type { Accessor } from 'solid-js'

export type HotkeyOptions = {
  target?: () => EventTarget | null | undefined
  enabled?: () => boolean
  allowInInput?: boolean
  preventDefault?: boolean
}

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  space: ' ',
}

const INPUT_SELECTOR = 'input,textarea,select,[contenteditable]:not([contenteditable="false"])'

const isApplePlatform = () => /mac|iphone|ipad|ipod/i.test(navigator.userAgent)

const parseCombo = (combo: string) => {
  const parts = combo.toLowerCase().split('+')
  const key = parts.at(-1) ?? ''
  return { key: KEY_ALIASES[key] ?? key, modifiers: new Set(parts.slice(0, -1)) }
}

export const matchesHotkey = (event: KeyboardEvent, combo: string, apple: boolean) => {
  const { key, modifiers } = parseCombo(combo)
  const wantMeta = modifiers.has('meta') || (modifiers.has('mod') && apple)
  const wantCtrl = modifiers.has('ctrl') || (modifiers.has('mod') && !apple)
  return (
    event.key.toLowerCase() === key &&
    event.metaKey === wantMeta &&
    event.ctrlKey === wantCtrl &&
    event.altKey === modifiers.has('alt') &&
    event.shiftKey === modifiers.has('shift')
  )
}

const isEditableTarget = (target: EventTarget | null) =>
  !!target && 'closest' in target && (target as Element).closest(INPUT_SELECTOR) !== null

export const useHotkey = (
  combo: string,
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {}
) => {
  const { modifiers } = parseCombo(combo)
  const bypassInputGuard =
    options.allowInInput || modifiers.has('mod') || modifiers.has('ctrl') || modifiers.has('meta')

  onSettled(() => {
    const apple = isApplePlatform()
    const target = options.target ? options.target() : window
    if (!target) return
    const guardInputs = !options.target && !bypassInputGuard

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return
      if (!matchesHotkey(event, combo, apple)) return
      if (guardInputs && isEditableTarget(event.target)) return
      if (options.enabled && !options.enabled()) return
      if (options.preventDefault ?? true) event.preventDefault()
      handler(event)
    }

    const listener = handleKeyDown as EventListener
    target.addEventListener('keydown', listener)
    return () => target.removeEventListener('keydown', listener)
  })
}

export const useModKeyLabel = (key?: string): Accessor<string> => {
  const [label, setLabel] = createSignal('⌘', { name: 'modKeyLabel' })

  onSettled(() => {
    if (!isApplePlatform()) setLabel('Ctrl')
  })

  return () => {
    if (!key) return label()
    return label() === '⌘' ? `⌘${key}` : `${label()} ${key}`
  }
}
