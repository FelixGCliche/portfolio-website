import { describe, expect, test } from 'bun:test'

import { about, education, profile, projects, roles, skills, topics } from '@content'

import { agentTools } from '@features/agent-tools'
import { LOCALE_NAMES, LOCALES } from '@features/locales'
import { videoWatchUrl } from '@features/safe-links'
import { TOPIC_KEYS } from '@features/topic-keys'

import { buildSystemPrompt, htmlToText, type PromptContent, systemPromptFor } from './systemPrompt'

const MAX_PROMPT_CHARS = 12_000

const forLocale = <T extends { locale: string }>(items: T[], locale: string) =>
  items.filter((item) => item.locale === locale)

const content: PromptContent = {
  profile,
  about,
  roles,
  projects,
  skills,
  topics,
  education,
}

describe('buildSystemPrompt', () => {
  test('defaults replies to the requested locale language', () => {
    expect(buildSystemPrompt('en')).toContain('so use English when')
    expect(buildSystemPrompt('fr')).toContain('so use French when')
  })

  test('mirrors the visitor language without a conflicting rule', () => {
    const prompt = buildSystemPrompt('fr')
    expect(prompt).toContain('Reply in the language the visitor writes in')
    expect(prompt).not.toContain('Always reply in')
    expect(prompt).not.toContain('Site language for this conversation')
  })

  test.each([...LOCALES])('keeps the phone number out of the %s prompt', (locale) => {
    const prompt = buildSystemPrompt(locale)
    for (const entry of profile) expect(prompt).not.toContain(entry.phone)
    expect(prompt).toContain('Never disclose or guess any other personal contact details')
    expect(prompt).toContain('such as a phone number or home address, including inside blocks.')
  })

  test('lists every education entry for the locale', () => {
    const [entry] = education.filter((item) => item.locale === 'en')
    const second = {
      ...entry,
      degree: 'Second degree',
      start: 2001,
      end: 2004,
    }
    const prompt = buildSystemPrompt('en', {
      ...content,
      education: [second, entry],
    })
    expect(prompt).toContain(`${entry.degree}, `)
    expect(prompt).toContain('Second degree, ')
  })

  test('asks for plain-text replies without markdown, preferring tools', () => {
    const prompt = buildSystemPrompt('en')
    expect(prompt).toContain('Any text you write is plain text only')
    expect(prompt).toContain(
      'no markdown, bold, italics, lists, links, headings, tables, images or HTML'
    )
    expect(prompt).toContain('Prefer a tool over text')
    expect(prompt).not.toContain('plain text only. Never')
  })

  test('routes project questions to show_topic, never render_blocks', () => {
    const prompt = buildSystemPrompt('en')
    expect(prompt).toContain(
      'For any question about projects or about one named project, call show_topic with key "/projects" (and project set to that project\'s slug when one is named) plus at most one short sentence.'
    )
    expect(prompt).toContain('Never use render_blocks for projects.')
  })

  test('asks for render_blocks on other structured answers without repeating them', () => {
    const prompt = buildSystemPrompt('en')
    expect(prompt).toContain('call render_blocks instead of writing them out')
    expect(prompt).toContain(
      'write any accompanying text (at most one short sentence) before the tool call, and never repeat what the tool shows'
    )
  })

  test('limits render_blocks to a single call per reply', () => {
    expect(buildSystemPrompt('en')).toContain('Call it exactly once per reply')
  })

  test('memoizes the prompt per locale', () => {
    for (const locale of LOCALES) expect(systemPromptFor(locale)).toBe(buildSystemPrompt(locale))
  })

  test.each([...LOCALES])('includes the %s portfolio content', (locale) => {
    const prompt = buildSystemPrompt(locale)
    const own = <T extends { locale: string }>(items: T[]) => forLocale(items, locale)

    for (const entry of own(profile)) {
      expect(prompt).toContain(entry.name)
      expect(prompt).toContain(entry.role)
      expect(prompt).toContain(entry.email)
    }
    for (const role of own(roles)) {
      expect(prompt).toContain(`${role.title} at ${role.company}`)
      for (const bullet of role.bullets) expect(prompt).toContain(`  - ${bullet}`)
    }
    for (const project of own(projects)) {
      expect(prompt).toContain(
        `- ${project.name} (${project.year}; ${project.stack.join(', ')}) [slug: ${project.slug}]: `
      )
      expect(prompt).toContain(project.description)
      for (const paragraph of project.built) expect(prompt).toContain(paragraph)
      if (project.url) expect(prompt).toContain(`Play: ${project.url}`)
      const watch = project.video && videoWatchUrl(project.video)
      if (watch) expect(prompt).toContain(`Watch: ${watch}`)
    }
    for (const skill of own(skills)) expect(prompt).toContain(skill.area)
    for (const topic of own(topics)) expect(prompt).toContain(`${topic.key}: ${topic.desc}`)
    for (const entry of own(education)) expect(prompt).toContain(entry.degree)
    for (const entry of own(about)) {
      const firstLine = htmlToText(entry.body).split('\n')[0]
      expect(firstLine.length).toBeGreaterThan(0)
      expect(prompt).toContain(firstLine)
    }
  })

  test.each([...LOCALES])('is compact plain text with no empty sections in %s', (locale) => {
    const prompt = buildSystemPrompt(locale)
    const lines = prompt.split('\n')
    lines.forEach((line, i) => {
      if (line.startsWith('## ')) expect(lines[i + 1]?.trim()).toBeTruthy()
    })
    expect(prompt).not.toMatch(/<\/?[a-z][^>]*>/i)
    expect(prompt).not.toContain('undefined')
    expect(prompt.length).toBeLessThan(MAX_PROMPT_CHARS)
  })

  test('omits sections with no entries', () => {
    const about = [{ locale: 'en' as const, body: '<p> </p>' }]
    const prompt = buildSystemPrompt('en', {
      ...content,
      about,
      roles: [],
      projects: [],
      skills: [],
    })
    expect(prompt).not.toContain('## About')
    expect(prompt).not.toContain('## Work experience')
    expect(prompt).not.toContain('## Projects')
    expect(prompt).not.toContain('## Skills')
    expect(prompt).toContain('## Profile')
  })

  test.each([...LOCALES])('lists only the %s projects', (locale) => {
    const prompt = buildSystemPrompt(locale)
    expect(prompt).toContain('## Projects')
    const ownNames = forLocale(projects, locale).map((item) => item.name)
    expect(ownNames.length).toBeGreaterThan(0)
    for (const project of projects.filter((item) => item.locale !== locale))
      if (!ownNames.includes(project.name)) expect(prompt).not.toContain(`- ${project.name} (`)
  })

  test('avoids doubled punctuation and puts Play:/Watch: URLs on their own lines', () => {
    const [project] = forLocale(projects, 'en')
    const prompt = buildSystemPrompt('en', {
      ...content,
      projects: [
        {
          ...project,
          description: 'Ends already!',
          url: 'https://example.com/play',
          video: undefined,
        },
      ],
    })
    expect(prompt).toContain('Ends already! ')
    expect(prompt).not.toContain('Ends already!.')
    expect(prompt).toContain('\n  Play: https://example.com/play')
    const plain = buildSystemPrompt('en', {
      ...content,
      projects: [{ ...project, description: 'No period' }],
    })
    expect(plain).toContain('No period. ')
  })

  test('mentions projects in the intro', () => {
    expect(buildSystemPrompt('en')).toContain('their work, skills, projects, background')
  })

  test('marks ongoing roles as present', () => {
    const [role] = roles.filter((item) => item.locale === 'en')
    const prompt = buildSystemPrompt('en', {
      ...content,
      roles: [{ ...role, end: null }],
    })
    expect(prompt).toContain(`(${role.start} to present)`)
  })
})

describe('agent tools', () => {
  test.each([...LOCALES])('leaves tool descriptions to the schemas in the %s prompt', (locale) => {
    const prompt = buildSystemPrompt(locale)
    for (const tool of agentTools) expect(prompt).not.toContain(tool.description)
  })

  test('lists every supported locale with its name', () => {
    const prompt = buildSystemPrompt('en')
    for (const locale of LOCALES) expect(prompt).toContain(`${LOCALE_NAMES[locale]} (${locale})`)
  })

  test('names the projects topic key from the shared constants', () => {
    expect(TOPIC_KEYS).toContain('/projects')
    expect(buildSystemPrompt('en')).toContain('key "/projects"')
  })
})

describe('htmlToText', () => {
  test('strips tags into paragraphs and decodes entities', () => {
    expect(htmlToText('<p>Hi &amp; <strong>bye</strong></p>\n<p>It&#x27;s &#233;t&#xe9;</p>')).toBe(
      "Hi & bye\nIt's été"
    )
  })

  test('decodes French accents and typography', () => {
    expect(
      htmlToText(
        '<p>&#201;cole &#xE0; Québec &laquo;&nbsp;oui&nbsp;&raquo; l&rsquo;été&hellip;</p>'
      )
    ).toBe('École à Québec « oui » l’été…')
  })

  test('leaves unknown and out-of-range references as written', () => {
    expect(htmlToText('<p>&bogus; &#x110000; &#9999999999; &#x1F600;</p>')).toBe(
      '&bogus; &#x110000; &#9999999999; \u{1F600}'
    )
  })
})
