import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, type Locale } from './locales'

const readStoredLocale = (): Locale | undefined => {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(stored) ? stored : undefined
  } catch {
    return undefined
  }
}

const readNavigatorLocale = (): Locale | undefined => {
  if (typeof navigator === 'undefined') return undefined
  const candidates = [...(navigator.languages ?? []), navigator.language]
  for (const tag of candidates) {
    const primary = tag?.split('-')[0]?.toLowerCase()
    if (isLocale(primary)) return primary
  }
  return undefined
}

// Stored preference, then browser language (primary subtag), then default.
export const detectLocale = (): Locale => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  return readStoredLocale() ?? readNavigatorLocale() ?? DEFAULT_LOCALE
}

export const storeLocale = (locale: Locale): void => {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Storage unavailable (SSR, private mode, blocked); ignore.
  }
}
