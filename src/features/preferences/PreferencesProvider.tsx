import { useNavigate, useParams } from '@tanstack/solid-router'
import { createContext, createEffect, createSignal, onSettled, untrack, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import { storeLocale, useI18n } from '@features/i18n'
import type { Locale } from '@features/i18n'

import { DEFAULT_THEME, THEME_COLOR_META_ID, THEME_COLORS, THEME_STORAGE_KEY } from './constants'

export type Theme = 'dark' | 'light'

export type PreferencesContextValue = {
  theme: Accessor<Theme>
  lang: Accessor<Locale>
  toggleTheme: () => void
  toggleLang: () => void
}

export const PreferencesContext = createContext<PreferencesContextValue>()

export const usePreferences = () => useContext(PreferencesContext)

const isTheme = (value: unknown): value is Theme => value === 'dark' || value === 'light'

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
  const [theme, setTheme] = createSignal<Theme>(DEFAULT_THEME, { name: 'preferencesTheme' })
  const [synced, setSynced] = createSignal(false, { name: 'preferencesSynced' })

  onSettled(() => {
    // THEME_INIT_SCRIPT already resolved stored/OS preferences onto <html> before first paint
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    setSynced(true)

    // Live theme sync across tabs; values come from another tab, so they are applied without re-persisting
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) setTheme(event.newValue)
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

  const toggleTheme = () => {
    const next: Theme = theme() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    persist(THEME_STORAGE_KEY, next)
  }

  // The URL is the source of truth: switch the locale segment, keeping topic, search and hash.
  const toggleLang = () => {
    const next: Locale = untrack(() => i18n.locale()) === 'en' ? 'fr' : 'en'
    const topic = untrack(() => (params() as { topic?: string } | undefined)?.topic)
    storeLocale(next)
    void navigate({
      to: '/$locale/{-$topic}',
      params: { locale: next, topic },
      search: true,
      hash: true,
    })
  }

  const value: PreferencesContextValue = { theme, lang: i18n.locale, toggleTheme, toggleLang }

  return <PreferencesContext value={value}>{props.children}</PreferencesContext>
}
