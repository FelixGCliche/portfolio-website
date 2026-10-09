export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

// English names, for text read by the agent's model (system prompt, tool descriptions)
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', fr: 'French' }

// Also read by preferences' THEME_INIT_SCRIPT before first paint
export const LOCALE_STORAGE_KEY = 'lang'

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
