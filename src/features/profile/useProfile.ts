import { profile } from '@content'
import type { Profile } from '@content'
import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { pickSingleton, useI18n } from '@features/i18n'

// Reactive profile for the active locale (name, role, location, status, links, hero copy).
export const useProfile = (): Accessor<Profile> => {
  const i18n = useI18n()
  return createMemo(() => pickSingleton(profile, i18n.locale()), { name: 'profile' })
}
