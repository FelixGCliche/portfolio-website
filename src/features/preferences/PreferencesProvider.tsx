import { createContext, createEffect, createSignal, onSettled, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import { LANG_STORAGE_KEY, THEME_COLOR_META_ID, THEME_COLORS, THEME_STORAGE_KEY } from './constants'

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

const persist = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable (private mode, blocked); preference stays in memory only
  }
}

export const PreferencesProvider = (props: ParentProps) => {
  const [theme, setTheme] = createSignal<Theme>('dark', { name: 'preferencesTheme' })
  const [lang, setLang] = createSignal<Lang>('en', { name: 'preferencesLang' })
  const [synced, setSynced] = createSignal(false, { name: 'preferencesSynced' })

  onSettled(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')

    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY)
      if (stored === 'en' || stored === 'fr') setLang(stored)
    } catch {
      // storage unavailable; keep default
    }

    setSynced(true)
  })

  createEffect(
    () => (synced() ? theme() : undefined),
    (current) => {
      if (!current) return

      document.documentElement.classList.toggle('dark', current === 'dark')
      document.getElementById(THEME_COLOR_META_ID)?.setAttribute('content', THEME_COLORS[current])
      persist(THEME_STORAGE_KEY, current)
    },
    { name: 'preferencesThemeEffect' }
  )

  createEffect(
    () => (synced() ? lang() : undefined),
    (current) => {
      if (current) persist(LANG_STORAGE_KEY, current)
    },
    { name: 'preferencesLangEffect' }
  )

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  const toggleLang = () => setLang((current) => (current === 'en' ? 'fr' : 'en'))

  const value: PreferencesContextValue = { theme, lang, toggleTheme, toggleLang }

  return <PreferencesContext value={value}>{props.children}</PreferencesContext>
}
