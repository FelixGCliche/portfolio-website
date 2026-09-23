export const THEME_STORAGE_KEY = 'theme'
export const LANG_STORAGE_KEY = 'lang'
export const THEME_COLOR_META_ID = 'theme-color'

// Nord0 (dark background) and Nord4 (light background, matches theme.css light --background)
export const THEME_COLORS = { dark: '#2E3440', light: '#D8DEE9' } as const

export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==='dark'||t==='light'){document.documentElement.classList.toggle('dark',t==='dark');var m=document.getElementById(${JSON.stringify(THEME_COLOR_META_ID)});if(m)m.setAttribute('content',t==='dark'?${JSON.stringify(THEME_COLORS.dark)}:${JSON.stringify(THEME_COLORS.light)})}}catch(e){}`
