import { useParams } from '@tanstack/solid-router'
import { createContext, createEffect, createMemo, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import { detectLocale, storeLocale } from './detectLocale'
import { isLocale, type Locale } from './locales'
import { stringsFor, translate, type TranslateVars, type UiKey } from './translate'

export type I18nContextValue = {
  locale: Accessor<Locale>
  t: (key: UiKey, vars?: TranslateVars) => string
}

export const I18nContext = createContext<I18nContextValue>()

export const useI18n = () => useContext(I18nContext)

// Locale comes from the `locale` route param when present and valid, else from detectLocale()
// (stored preference, browser language, default).
export const I18nProvider = (props: ParentProps) => {
  const params = useParams({ strict: false, shouldThrow: false })
  const detected = detectLocale()

  const locale = createMemo<Locale>(
    () => {
      const param = (params() as { locale?: unknown } | undefined)?.locale
      return isLocale(param) ? param : detected
    },
    { name: 'i18nLocale' }
  )

  // Persist a locale reached by direct URL so `/` redirects to it on the next visit.
  createEffect(
    () => {
      const param = (params() as { locale?: unknown } | undefined)?.locale
      return isLocale(param) ? param : undefined
    },
    (routeLocale) => {
      if (routeLocale) storeLocale(routeLocale)
    },
    { name: 'i18nPersistLocale' }
  )

  const strings = createMemo(() => stringsFor(locale()), { name: 'i18nStrings' })

  // Document.tsx renders the default-locale title/description; keep them in sync with the locale.
  createEffect(
    () => ({
      title: translate(strings(), 'document.title'),
      description: translate(strings(), 'document.description'),
    }),
    ({ title, description }) => {
      document.title = title
      document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    },
    { name: 'i18nDocumentMetaEffect' }
  )

  const value: I18nContextValue = {
    locale,
    t: (key, vars) => translate(strings(), key, vars),
  }

  return <I18nContext value={value}>{props.children}</I18nContext>
}
