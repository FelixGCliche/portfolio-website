import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES, stringsFor, translate } from '@features/i18n'

export const THEME_STORAGE_KEY = 'theme'
export const THEME_COLOR_META_ID = 'theme-color'

export const DEFAULT_THEME = 'dark'

// Nord0 (dark background) and Nord4 (light background, matches theme.css light --background)
export const THEME_COLORS = { dark: '#2E3440', light: '#D8DEE9' } as const

// Per-locale document titles, applied by THEME_INIT_SCRIPT so the tab title matches `lang` from the start
const LOCALE_TITLES = Object.fromEntries(
  LOCALES.map((locale) => [locale, translate(stringsFor(locale), 'document.title')])
)

// Runs in <head> before first paint: theme = stored value, else OS preference;
// lang (and title) = URL's first path segment when it is a locale, else stored value, else default.
// Storage reads are guarded individually so blocked storage still falls back to the OS preference.
export const THEME_INIT_SCRIPT = `try{var d=document.documentElement,L=${JSON.stringify(LOCALES)},g=(k)=>{try{return localStorage.getItem(k)}catch(e){return null}},t=g(${JSON.stringify(THEME_STORAGE_KEY)}),p=location.pathname.split('/')[1],l=L.indexOf(p)>=0?p:g(${JSON.stringify(LOCALE_STORAGE_KEY)});if(t!=='dark'&&t!=='light')t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';d.classList.toggle('dark',t==='dark');var m=document.getElementById(${JSON.stringify(THEME_COLOR_META_ID)});if(m)m.setAttribute('content',t==='dark'?${JSON.stringify(THEME_COLORS.dark)}:${JSON.stringify(THEME_COLORS.light)});d.lang=L.indexOf(l)>=0?l:${JSON.stringify(DEFAULT_LOCALE)};document.title=${JSON.stringify(LOCALE_TITLES)}[d.lang]}catch(e){}`
