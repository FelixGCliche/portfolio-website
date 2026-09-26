export const THEME_STORAGE_KEY = 'theme'
export const LANG_STORAGE_KEY = 'lang'
export const THEME_COLOR_META_ID = 'theme-color'

export const DEFAULT_THEME = 'dark'
export const DEFAULT_LANG = 'en'

// Nord0 (dark background) and Nord4 (light background, matches theme.css light --background)
export const THEME_COLORS = { dark: '#2E3440', light: '#D8DEE9' } as const

// Runs in <head> before first paint: theme = stored value, else OS preference; lang = stored value.
// Storage reads are guarded individually so blocked storage still falls back to the OS preference.
export const THEME_INIT_SCRIPT = `try{var d=document.documentElement,g=(k)=>{try{return localStorage.getItem(k)}catch(e){return null}},t=g(${JSON.stringify(THEME_STORAGE_KEY)}),l=g(${JSON.stringify(LANG_STORAGE_KEY)});if(t!=='dark'&&t!=='light')t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';d.classList.toggle('dark',t==='dark');var m=document.getElementById(${JSON.stringify(THEME_COLOR_META_ID)});if(m)m.setAttribute('content',t==='dark'?${JSON.stringify(THEME_COLORS.dark)}:${JSON.stringify(THEME_COLORS.light)});if(l==='en'||l==='fr')d.lang=l}catch(e){}`
