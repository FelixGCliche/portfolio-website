import { createSignal, onSettled } from 'solid-js'
import type { Accessor } from 'solid-js'

const MOBILE_QUERY = '(max-width: 1023px)'

export const useIsMobile = (): Accessor<boolean> => {
  const [isMobile, setIsMobile] = createSignal(false, { name: 'isMobile' })

  onSettled(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    setIsMobile(mql.matches)

    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  })

  return isMobile
}
