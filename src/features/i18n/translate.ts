import { ui } from '@content'
import type { UiKey } from '@content/ui-keys'

import { DEFAULT_LOCALE, type Locale } from '@features/locales'

export type { UiKey }

export type UiStrings = Record<string, string>

export type TranslateVars = Record<string, string | number>

const EMPTY: UiStrings = {}

const DEFAULT_STRINGS: UiStrings =
  ui.find((entry) => entry.locale === DEFAULT_LOCALE)?.strings ?? EMPTY

export const stringsFor = (locale: Locale): UiStrings =>
  ui.find((entry) => entry.locale === locale)?.strings ?? DEFAULT_STRINGS

// `{var}` slots are replaced from `vars`; unknown slots are left as-is.
const interpolate = (template: string, vars?: TranslateVars) =>
  vars
    ? template.replace(/\{(\w+)\}/g, (slot, name: string) =>
        name in vars ? String(vars[name]) : slot
      )
    : template

// Missing key falls back to the default-locale string, then to the key itself.
export const translate = (strings: UiStrings, key: UiKey, vars?: TranslateVars): string =>
  interpolate(strings[key] ?? DEFAULT_STRINGS[key] ?? key, vars)
