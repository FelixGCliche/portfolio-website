import { onSettled } from 'solid-js'
import type { Accessor } from 'solid-js'

export type HotkeyOptions = {
  target?: () => EventTarget | null | undefined
  enabled?: () => boolean
  allowInInput?: boolean
  preventDefault?: boolean
  exact?: boolean
}

type Modifier = 'meta' | 'mod' | 'ctrl' | 'alt' | 'shift'

type ParsedCombo = {
  key: string
  code: string | undefined
  modifiers: Set<Modifier>
}

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  space: ' ',
  plus: '+',
}

const MODIFIER_ALIASES: Record<string, Modifier> = {
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  mod: 'mod',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
}

const PUNCTUATION_CODES: Record<string, string> = {
  '/': 'Slash',
  '=': 'Equal',
  '-': 'Minus',
  ',': 'Comma',
  '.': 'Period',
  ';': 'Semicolon',
  "'": 'Quote',
  '`': 'Backquote',
  '\\': 'Backslash',
  '[': 'BracketLeft',
  ']': 'BracketRight',
}

const INPUT_SELECTOR = 'input,textarea,select,[contenteditable]:not([contenteditable="false"])'

const isApplePlatform = () =>
  typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.userAgent)

const physicalCode = (key: string) => {
  if (/^[a-z]$/.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  return PUNCTUATION_CODES[key]
}

const COMBO_PATTERN = /^(?:(.*)\+)?(\+|[^+]+)$/

const parseCombo = (combo: string): ParsedCombo => {
  const match = COMBO_PATTERN.exec(combo.toLowerCase())
  if (!match) throw new Error(`Missing key in hotkey "${combo}"`)
  const [, rawModifiers, rawKey] = match

  const modifiers = new Set<Modifier>()
  for (const raw of rawModifiers === undefined ? [] : rawModifiers.split('+')) {
    const modifier = MODIFIER_ALIASES[raw]
    if (!modifier) throw new Error(`Unknown modifier "${raw}" in hotkey "${combo}"`)
    modifiers.add(modifier)
  }

  const key = KEY_ALIASES[rawKey] ?? rawKey
  return { key, code: physicalCode(key), modifiers }
}

type Matcher = {
  key: string
  code: string | undefined
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
  symbolKey: boolean
  exact: boolean
  bypassInputGuard: boolean
}

const toMatcher = (parsed: ParsedCombo, apple: boolean, exact: boolean): Matcher => {
  const { key, code, modifiers } = parsed
  const mod = modifiers.has('mod')
  return {
    key,
    code,
    meta: modifiers.has('meta') || (mod && apple),
    ctrl: modifiers.has('ctrl') || (mod && !apple),
    alt: modifiers.has('alt'),
    shift: modifiers.has('shift'),
    symbolKey: key.length === 1 && !/[a-z0-9 ]/.test(key),
    exact,
    bypassInputGuard: mod || modifiers.has('ctrl') || modifiers.has('meta'),
  }
}

const modifierMatches = (pressed: boolean, wanted: boolean, exact: boolean) =>
  wanted ? pressed : !exact || !pressed

const matches = (event: KeyboardEvent, m: Matcher) => {
  const { exact } = m
  if (
    !modifierMatches(event.metaKey, m.meta, exact) ||
    !modifierMatches(event.ctrlKey, m.ctrl, exact) ||
    !modifierMatches(event.altKey, m.alt, exact) ||
    !(modifierMatches(event.shiftKey, m.shift, exact) || (!m.shift && m.symbolKey))
  )
    return false
  if (event.key.toLowerCase() === m.key) return true
  const composed = m.shift || m.alt || (!exact && (event.shiftKey || event.altKey))
  return composed && m.code !== undefined && event.code === m.code
}

export const matchesHotkey = (event: KeyboardEvent, combo: string, apple: boolean, exact = true) =>
  matches(event, toMatcher(parseCombo(combo), apple, exact))

const isEditableTarget = (target: EventTarget | null) =>
  !!target && 'closest' in target && (target as Element).closest(INPUT_SELECTOR) !== null

export const useHotkey = (
  combo: string | string[],
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {}
) => {
  const parsed = (Array.isArray(combo) ? combo : [combo]).map(parseCombo)
  const { target: getTarget, enabled, allowInInput, preventDefault = true, exact = true } = options

  onSettled(() => {
    const target = getTarget ? getTarget() : window
    if (!target) return
    const apple = isApplePlatform()
    const matchers = parsed.map((p) => toMatcher(p, apple, exact))
    const guardInputs = !getTarget && !allowInInput

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return
      let editable: boolean | undefined
      const hit = matchers.some(
        (m) =>
          matches(event, m) &&
          (!guardInputs || m.bypassInputGuard || !(editable ??= isEditableTarget(event.target)))
      )
      if (!hit) return
      if (enabled && !enabled()) return
      if (preventDefault) event.preventDefault()
      handler(event)
    }

    const listener = handleKeyDown as EventListener
    target.addEventListener('keydown', listener)
    return () => target.removeEventListener('keydown', listener)
  })
}

export const useModKeyLabel = (key?: string): Accessor<string> => {
  const apple = isApplePlatform()

  return () => {
    if (apple) return key ? `⌘${key}` : '⌘'
    return key ? `Ctrl ${key}` : 'Ctrl'
  }
}
