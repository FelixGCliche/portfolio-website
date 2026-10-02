import { defineCollection, defineConfig, s } from 'velite'

type Locale = 'en' | 'fr'

const localeFromPath = (path: string): Locale => {
  const locale = path.split(/[\\/]+/).at(-2)
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

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:8].[ext]',
    clean: true,
  },
  collections: { profile, about },
})
