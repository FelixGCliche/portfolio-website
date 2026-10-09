import { DEFAULT_LOCALE, type Locale } from './locales'

type Localized = { locale: Locale }

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order

// Singleton entry for `locale`, falling back to the default locale's entry.
export const pickSingleton = <T extends Localized>(items: T[], locale: Locale): T => {
  const entry =
    items.find((item) => item.locale === locale) ??
    items.find((item) => item.locale === DEFAULT_LOCALE)
  if (!entry) throw new Error(`Missing ${DEFAULT_LOCALE} content entry`)
  return entry
}

export const pickSorted = <T extends Localized & { order: number }>(
  items: T[],
  locale: Locale
): T[] => items.filter((item) => item.locale === locale).sort(byOrder)
