import { useMediaQuery } from './useMediaQuery'

const MOBILE_QUERY = '(max-width: 1023px)'

export const useIsMobile = () => useMediaQuery(MOBILE_QUERY, 'isMobile')
