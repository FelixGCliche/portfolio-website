export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

// Same key as preferences' LANG_STORAGE_KEY (read by THEME_INIT_SCRIPT before first paint)
export const LOCALE_STORAGE_KEY = 'lang'

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
