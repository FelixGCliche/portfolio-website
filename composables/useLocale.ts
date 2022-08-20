export const useLocale = () => {
  return useState<string>('locale', () => useDefaultLocale().value)
}
export const setLocale = (locale: string) => {
  if (locale === 'fr' || locale === 'en')
    return useState<string>('locale', () => locale)
  else console.log(`Locale ${locale} is not available`)
}
const useDefaultLocale = (fallback = 'fr') => {
  const locale = ref(fallback)

  if (process.server) {
    try {
      const reqLang: string =
        useNuxtApp().ssrContext?.req.headers['accept-language'].split(',')[0]
      if (reqLang) {
        locale.value = reqLang.split('-')[0]
      }
    } catch (error) {
      console.log(
        `Error getting client locale, fallback on locale ${locale}. Error: ${error}`
      )
      return locale
    }
  } else if (process.client) {
    try {
      const navLang: string = navigator.language
      if (navLang) {
        locale.value = navLang.split('-')[0]
      }
    } catch (error) {
      console.log(
        `Error getting client locale, fallback on locale ${locale}. Error: ${error}`
      )
      return locale
    }
  }

  return locale
}