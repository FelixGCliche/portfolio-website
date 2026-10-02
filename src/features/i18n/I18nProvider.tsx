import { about, commands, education, profile, roles, sessions, skills } from '@content'
import type { About, Command, Education, Profile, Role, Session, Skill } from '@content'
import { useParams } from '@tanstack/solid-router'
import { createContext, createEffect, createMemo, useContext } from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import { detectLocale, storeLocale } from './detectLocale'
import { DEFAULT_LOCALE, isLocale, type Locale } from './locales'
import { stringsFor, translate, type TranslateVars, type UiKey } from './translate'

export type I18nContextValue = {
  locale: Accessor<Locale>
  t: (key: UiKey, vars?: TranslateVars) => string
  profile: Accessor<Profile>
  about: Accessor<About>
  education: Accessor<Education>
  roles: Accessor<Role[]>
  skills: Accessor<Skill[]>
  sessions: Accessor<Session[]>
  commands: Accessor<Command[]>
}

export const I18nContext = createContext<I18nContextValue>()

export const useI18n = () => useContext(I18nContext)

type Localized = { locale: Locale }

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order

// Singleton entry for `locale`, falling back to the default locale's entry.
const pickSingleton = <T extends Localized>(items: T[], locale: Locale): T => {
  const entry =
    items.find((item) => item.locale === locale) ??
    items.find((item) => item.locale === DEFAULT_LOCALE)
  if (!entry) throw new Error(`Missing ${DEFAULT_LOCALE} content entry`)
  return entry
}

const pickSorted = <T extends Localized & { order: number }>(items: T[], locale: Locale): T[] =>
  items.filter((item) => item.locale === locale).sort(byOrder)

// Locale comes from the `locale` route param when present and valid, else from detectLocale()
// (stored preference, browser language, default).
export const I18nProvider = (props: ParentProps) => {
  const params = useParams({ strict: false, shouldThrow: false })
  const detected = detectLocale()

  const locale = createMemo<Locale>(
    () => {
      const param = (params() as { locale?: unknown } | undefined)?.locale
      return isLocale(param) ? param : detected
    },
    { name: 'i18nLocale' }
  )

  // Persist a locale reached by direct URL so `/` redirects to it on the next visit.
  createEffect(
    () => {
      const param = (params() as { locale?: unknown } | undefined)?.locale
      return isLocale(param) ? param : undefined
    },
    (routeLocale) => {
      if (routeLocale) storeLocale(routeLocale)
    },
    { name: 'i18nPersistLocale' }
  )

  const strings = createMemo(() => stringsFor(locale()), { name: 'i18nStrings' })

  const localeProfile = createMemo(() => pickSingleton(profile, locale()), { name: 'i18nProfile' })
  const localeAbout = createMemo(() => pickSingleton(about, locale()), { name: 'i18nAbout' })
  const localeEducation = createMemo(() => pickSingleton(education, locale()), {
    name: 'i18nEducation',
  })
  const localeRoles = createMemo(() => pickSorted(roles, locale()), { name: 'i18nRoles' })
  const localeSkills = createMemo(() => pickSorted(skills, locale()), { name: 'i18nSkills' })
  const localeSessions = createMemo(() => pickSorted(sessions, locale()), { name: 'i18nSessions' })
  const localeCommands = createMemo(() => pickSorted(commands, locale()), { name: 'i18nCommands' })

  // Document.tsx renders the default-locale title/description; keep them in sync with the locale.
  createEffect(
    () => ({
      title: translate(strings(), 'document.title'),
      description: translate(strings(), 'document.description'),
    }),
    ({ title, description }) => {
      document.title = title
      document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    },
    { name: 'i18nDocumentMetaEffect' }
  )

  const value: I18nContextValue = {
    locale,
    t: (key, vars) => translate(strings(), key, vars),
    profile: localeProfile,
    about: localeAbout,
    education: localeEducation,
    roles: localeRoles,
    skills: localeSkills,
    sessions: localeSessions,
    commands: localeCommands,
  }

  return <I18nContext value={value}>{props.children}</I18nContext>
}
