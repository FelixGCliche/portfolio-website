import { createSignal, onSettled } from 'solid-js'
import type { Accessor } from 'solid-js'

export const useMediaQuery = (query: string, name = 'mediaQuery'): Accessor<boolean> => {
  const [matches, setMatches] = createSignal(false, { name })

  onSettled(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)

    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  })

  return matches
}
