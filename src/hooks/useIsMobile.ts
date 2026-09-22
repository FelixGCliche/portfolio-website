import { createSignal, onSettled } from 'solid-js'
import type { Accessor } from 'solid-js'

const MOBILE_BREAKPOINT = 768

export const useIsMobile = (): Accessor<boolean> => {
  const [isMobile, setIsMobile] = createSignal(false, { name: 'isMobile' })

  onSettled(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    mql.addEventListener('change', onChange)
    onChange()

    return () => mql.removeEventListener('change', onChange)
  })

  return isMobile
}
