import { profile as contentProfile } from '@content'

import { DEFAULT_LOCALE } from '@features/i18n'

// Contact identity is locale-independent: non-reactive callers (static link lists, the document
// head) read it synchronously from the default-locale profile entry.
const defaultProfile = contentProfile.find((entry) => entry.locale === DEFAULT_LOCALE)
if (!defaultProfile) throw new Error(`Missing ${DEFAULT_LOCALE} profile content entry`)

export const DEFAULT_PROFILE = defaultProfile
export const EMAIL = defaultProfile.email
export const GITHUB_URL = defaultProfile.github
