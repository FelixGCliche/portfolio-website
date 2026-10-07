import { useNavigate, useParams } from '@tanstack/solid-router'
import { createContext, createEffect, createSignal, onSettled, untrack, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import { storeLocale, useI18n } from '@features/i18n'
import type { Locale } from '@features/i18n'
import { isTheme, type Theme } from '@features/themes'
import { paramToKey, topicRoute } from '@features/topics'

import { DEFAULT_THEME, THEME_COLOR_META_ID, THEME_COLORS, THEME_STORAGE_KEY } from './constants'

export type PreferencesContextValue = {
  theme: Accessor<Theme>
  lang: Accessor<Locale>
  toggleTheme: () => void
  toggleLang: () => void
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
}

export const PreferencesContext = createContext<PreferencesContextValue>()

export const usePreferences = () => useContext(PreferencesContext)

const persist = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable (private mode, blocked); preference stays in memory only
  }
}

// Must be mounted inside I18nProvider: lang is the route-derived locale.
export const PreferencesProvider = (props: ParentProps) => {
  const i18n = useI18n()
  const navigate = useNavigate()
  const params = useParams({ strict: false, shouldThrow: false })
  const [theme, setThemeValue] = createSignal<Theme>(DEFAULT_THEME, { name: 'preferencesTheme' })
  const [synced, setSynced] = createSignal(false, { name: 'preferencesSynced' })

  onSettled(() => {
    // THEME_INIT_SCRIPT already resolved stored/OS preferences onto <html> before first paint
    setThemeValue(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    setSynced(true)

    // Live theme sync across tabs; values come from another tab, so they are applied without re-persisting
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) setThemeValue(event.newValue)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  })

  createEffect(
    () => (synced() ? theme() : undefined),
    (current) => {
      if (!current) return

      document.documentElement.classList.toggle('dark', current === 'dark')
      document.getElementById(THEME_COLOR_META_ID)?.setAttribute('content', THEME_COLORS[current])
    },
    { name: 'preferencesThemeEffect' }
  )

  createEffect(
    () => i18n.locale(),
    (current) => {
      document.documentElement.lang = current
    },
    { name: 'preferencesLangEffect' }
  )

  const setTheme = (next: Theme) => {
    setThemeValue(next)
    persist(THEME_STORAGE_KEY, next)
  }

  const toggleTheme = () => setTheme(untrack(() => theme()) === 'dark' ? 'light' : 'dark')

  // The URL is the source of truth: switch the locale segment, keeping topic, search and hash.
  const setLocale = (next: Locale) => {
    if (next === untrack(() => i18n.locale())) return
    const topic = untrack(() => params()?.topic)
    storeLocale(next)
    void navigate({
      ...topicRoute(next, topic ? paramToKey(topic) : undefined),
      search: true,
      hash: true,
    })
  }

  const toggleLang = () => setLocale(untrack(() => i18n.locale()) === 'en' ? 'fr' : 'en')

  const value: PreferencesContextValue = {
    theme,
    lang: i18n.locale,
    toggleTheme,
    toggleLang,
    setTheme,
    setLocale,
  }

  return <PreferencesContext value={value}>{props.children}</PreferencesContext>
}
