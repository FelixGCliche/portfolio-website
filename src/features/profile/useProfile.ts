import { useI18n } from '@features/i18n'

// Reactive profile for the active locale (name, role, location, status, links, hero copy).
export const useProfile = () => useI18n().profile
