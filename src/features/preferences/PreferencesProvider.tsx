import { createContext, createEffect, createSignal, onSettled, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import {
  DEFAULT_LANG,
  DEFAULT_THEME,
  LANG_STORAGE_KEY,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  THEME_STORAGE_KEY,
} from './constants'

export type Theme = 'dark' | 'light'
export type Lang = 'en' | 'fr'

export type PreferencesContextValue = {
  theme: Accessor<Theme>
  lang: Accessor<Lang>
  toggleTheme: () => void
  toggleLang: () => void
}

export const PreferencesContext = createContext<PreferencesContextValue>()

export const usePreferences = () => useContext(PreferencesContext)

const isTheme = (value: unknown): value is Theme => value === 'dark' || value === 'light'
const isLang = (value: unknown): value is Lang => value === 'en' || value === 'fr'

const persist = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable (private mode, blocked); preference stays in memory only
  }
}

export const PreferencesProvider = (props: ParentProps) => {
  const [theme, setTheme] = createSignal<Theme>(DEFAULT_THEME, { name: 'preferencesTheme' })
  const [lang, setLang] = createSignal<Lang>(DEFAULT_LANG, { name: 'preferencesLang' })
  const [synced, setSynced] = createSignal(false, { name: 'preferencesSynced' })

  onSettled(() => {
    // THEME_INIT_SCRIPT already resolved stored/OS preferences onto <html> before first paint
    const root = document.documentElement
    setTheme(root.classList.contains('dark') ? 'dark' : 'light')
    if (isLang(root.lang)) setLang(root.lang)
    setSynced(true)

    // Live sync across tabs; values come from another tab, so they are applied without re-persisting
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) setTheme(event.newValue)
      if (event.key === LANG_STORAGE_KEY && isLang(event.newValue)) setLang(event.newValue)
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
    () => (synced() ? lang() : undefined),
    (current) => {
      if (current) document.documentElement.lang = current
    },
    { name: 'preferencesLangEffect' }
  )

  const toggleTheme = () => {
    const next: Theme = theme() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    persist(THEME_STORAGE_KEY, next)
  }

  const toggleLang = () => {
    const next: Lang = lang() === 'en' ? 'fr' : 'en'
    setLang(next)
    persist(LANG_STORAGE_KEY, next)
  }

  const value: PreferencesContextValue = { theme, lang, toggleTheme, toggleLang }

  return <PreferencesContext value={value}>{props.children}</PreferencesContext>
}
