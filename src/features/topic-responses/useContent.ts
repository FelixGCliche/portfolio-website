import { about, education, roles, skills } from '@content'
import type { About, Education, Role, Skill } from '@content'
import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { pickSingleton, pickSorted, useI18n } from '@features/i18n'

// Roles for the active locale, sorted by `order` (1 = newest).
export const useRoles = (): Accessor<Role[]> => {
  const i18n = useI18n()
  return createMemo(() => pickSorted(roles, i18n.locale()), { name: 'roles' })
}

export const useSkills = (): Accessor<Skill[]> => {
  const i18n = useI18n()
  return createMemo(() => pickSorted(skills, i18n.locale()), { name: 'skills' })
}

export const useEducation = (): Accessor<Education> => {
  const i18n = useI18n()
  return createMemo(() => pickSingleton(education, i18n.locale()), { name: 'education' })
}

export const useAbout = (): Accessor<About> => {
  const i18n = useI18n()
  return createMemo(() => pickSingleton(about, i18n.locale()), { name: 'about' })
}
