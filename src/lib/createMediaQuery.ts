import { createSignal, onSettled } from 'solid-js'
import type { Accessor } from 'solid-js'

export const createMediaQuery = (
  query: string,
  onChange?: (matches: boolean) => void
): Accessor<boolean> => {
  const [matches, setMatches] = createSignal(false, { name: `mediaQuery(${query})` })

  onSettled(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
      onChange?.(event.matches)
    }

    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  })

  return matches
}
