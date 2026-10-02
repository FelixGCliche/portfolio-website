import { defineCollection, defineConfig, s } from 'velite'

type Locale = 'en' | 'fr'

const localeFromPath = (path: string): Locale => {
  const locale = path.split(/[\\/]+/).find((segment) => segment === 'en' || segment === 'fr')
  if (locale !== 'en' && locale !== 'fr') throw new Error(`Cannot derive locale from path: ${path}`)
  return locale
}

const profile = defineCollection({
  name: 'Profile',
  pattern: '*/profile.yaml',
  schema: s
    .object({
      name: s.string(),
      role: s.string(),
      location: s.string(),
      email: s.string().email(),
      phone: s.string(),
      github: s.string().url(),
      linkedin: s.string().url(),
      status: s.string(),
      careerStart: s.string().regex(/^\d{4}-\d{2}$/),
      heroEyebrow: s.string(),
      heroTitle: s.string(),
      heroLede: s.string(),
    })
    .transform((data, { meta }) => ({
      ...data,
      locale: localeFromPath(meta.path),
    })),
})

const about = defineCollection({
  name: 'About',
  pattern: '*/about.md',
  schema: s
    .object({
      body: s.markdown(),
    })
    .transform((data, { meta }) => ({
      ...data,
      locale: localeFromPath(meta.path),
    })),
})

const roles = defineCollection({
  name: 'Role',
  pattern: '*/roles/*.yaml',
  schema: s
    .object({
      slug: s.string().regex(/^[a-z0-9-]+$/),
      title: s.string(),
      company: s.string(),
      start: s.string().regex(/^\d{4}-\d{2}$/),
      end: s
        .string()
        .regex(/^\d{4}-\d{2}$/)
        .nullable(),
      order: s.number(),
      bullets: s.array(s.string()),
    })
    .transform((data, { meta }) => ({
      ...data,
      locale: localeFromPath(meta.path),
    })),
})

const skills = defineCollection({
  name: 'Skill',
  pattern: '*/skills/*.yaml',
  schema: s
    .object({
      slug: s.string().regex(/^[a-z0-9-]+$/),
      area: s.string(),
      tools: s.array(s.string()),
      order: s.number(),
    })
    .transform((data, { meta }) => ({
      ...data,
      locale: localeFromPath(meta.path),
    })),
})

const education = defineCollection({
  name: 'Education',
  pattern: '*/education.yaml',
  schema: s
    .object({
      degree: s.string(),
      school: s.string(),
      start: s.number().int(),
      end: s.number().int(),
    })
    .transform((data, { meta }) => ({
      ...data,
      locale: localeFromPath(meta.path),
    })),
})

const sessions = defineCollection({
  name: 'Session',
  pattern: '*/sessions/*.yaml',
  schema: s
    .object({
      slug: s.string().regex(/^[a-z0-9-]+$/),
      key: s.string().regex(/^\/[a-z0-9-]+$/),
      meta: s.string(),
      desc: s.string(),
      order: s.number(),
    })
    .transform((data, { meta }) => ({
      ...data,
      locale: localeFromPath(meta.path),
    })),
})

const commands = defineCollection({
  name: 'Command',
  pattern: '*/commands/*.yaml',
  schema: s
    .object({
      slug: s.string().regex(/^[a-z0-9-]+$/),
      name: s.string().regex(/^\/[a-z0-9-]+$/),
      short: s.string(),
      keywords: s.string(),
      nav: s.boolean(),
      order: s.number(),
    })
    .transform((data, { meta }) => ({
      ...data,
      locale: localeFromPath(meta.path),
    })),
})

// Flat dot-notation keys (e.g. `composer.placeholder`); `{var}` marks an interpolation slot.
// Every locale file must carry the exact key set of content/en/ui.yaml.
const ui = defineCollection({
  name: 'Ui',
  pattern: '*/ui.yaml',
  schema: s.record(s.string(), s.string()).transform((strings, { meta }) => ({
    locale: localeFromPath(meta.path),
    strings,
  })),
})

const locales: Locale[] = ['en', 'fr']

type ParityItem = { locale: Locale; slug?: string; strings?: Record<string, string> }

const placeholders = (value: string) =>
  [...value.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',')

const singletonId = () => ['entry']
const slugId = (item: ParityItem) => [`slug "${item.slug}"`]
const uiKeyIds = (item: ParityItem) => Object.keys(item.strings ?? {}).map((key) => `key "${key}"`)

// How each collection's entries are matched across locales
const parityIds = {
  profile: singletonId,
  about: singletonId,
  education: singletonId,
  roles: slugId,
  skills: slugId,
  sessions: slugId,
  commands: slugId,
  ui: uiKeyIds,
}

// Collects "<collection>: <locale> missing <id>" for every id present in another locale but not this one.
const diffLocales = (
  collection: string,
  items: ParityItem[],
  ids: (item: ParityItem) => string[]
) => {
  const idsByLocale = locales.map(
    (locale) => new Set(items.filter((item) => item.locale === locale).flatMap(ids))
  )
  const all = new Set(idsByLocale.flatMap((set) => [...set]))
  return locales.flatMap((locale, i) =>
    [...all]
      .filter((id) => !idsByLocale[i].has(id))
      .map((id) => `${collection}: ${locale} missing ${id}`)
  )
}

const checkParity = (data: Record<keyof typeof parityIds, ParityItem[]>) => {
  const missing = (Object.keys(parityIds) as (keyof typeof parityIds)[]).flatMap((name) =>
    diffLocales(name, data[name], parityIds[name])
  )
  const [en, fr] = locales.map(
    (locale) => data.ui.find((item) => item.locale === locale)?.strings ?? {}
  )
  const mismatched = Object.keys(en).flatMap((key) => {
    if (!(key in fr)) return []
    const [enSlots, frSlots] = [placeholders(en[key]), placeholders(fr[key])]
    return enSlots === frSlots
      ? []
      : [`ui: placeholder mismatch for key "${key}" (en {${enSlots}} vs fr {${frSlots}})`]
  })
  const errors = [...missing, ...mismatched]
  if (errors.length > 0)
    throw new Error(`Bilingual content parity check failed:\n  - ${errors.join('\n  - ')}`)
}

export default defineConfig({
  complete: checkParity,
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:8].[ext]',
    clean: true,
  },
  collections: { profile, about, roles, education, skills, sessions, commands, ui },
})
