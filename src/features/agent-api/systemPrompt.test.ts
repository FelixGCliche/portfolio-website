import { describe, expect, test } from 'bun:test'

import { about, education, profile, roles, skills, topics } from '@content'

import { agentTools } from '@features/agent-tools'
import { LOCALE_NAMES, LOCALES } from '@features/locales'
import { TOPIC_KEYS } from '@features/topic-keys'

import { buildSystemPrompt, htmlToText, type PromptContent, systemPromptFor } from './systemPrompt'

const MAX_PROMPT_CHARS = 12_000

const content: PromptContent = { profile, about, roles, skills, topics, education }

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
  })

  test('lists every education entry for the locale', () => {
    const [entry] = education.filter((item) => item.locale === 'en')
    const second = { ...entry, degree: 'Second degree', start: 2001, end: 2004 }
    const prompt = buildSystemPrompt('en', { ...content, education: [second, entry] })
    expect(prompt).toContain(`${entry.degree}, `)
    expect(prompt).toContain('Second degree, ')
  })

  test('memoizes the prompt per locale', () => {
    for (const locale of LOCALES) expect(systemPromptFor(locale)).toBe(buildSystemPrompt(locale))
  })

  test.each([...LOCALES])('includes the %s portfolio content', (locale) => {
    const prompt = buildSystemPrompt(locale)
    const own = <T extends { locale: string }>(items: T[]) =>
      items.filter((item) => item.locale === locale)

    for (const entry of own(profile)) {
      expect(prompt).toContain(entry.name)
      expect(prompt).toContain(entry.role)
      expect(prompt).toContain(entry.email)
    }
    for (const role of own(roles)) {
      expect(prompt).toContain(`${role.title} at ${role.company}`)
      for (const bullet of role.bullets) expect(prompt).toContain(`  - ${bullet}`)
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
    const prompt = buildSystemPrompt('en', { ...content, about, roles: [], skills: [] })
    expect(prompt).not.toContain('## About')
    expect(prompt).not.toContain('## Work experience')
    expect(prompt).not.toContain('## Skills')
    expect(prompt).toContain('## Profile')
  })

  test('marks ongoing roles as present', () => {
    const [role] = roles.filter((item) => item.locale === 'en')
    const prompt = buildSystemPrompt('en', { ...content, roles: [{ ...role, end: null }] })
    expect(prompt).toContain(`(${role.start} to present)`)
  })
})

describe('agent tools', () => {
  test.each([...LOCALES])('are listed from their definitions in the %s prompt', (locale) => {
    const prompt = buildSystemPrompt(locale)
    for (const tool of agentTools) expect(prompt).toContain(`- ${tool.name}: ${tool.description}`)
  })

  test('lists every supported locale with its name', () => {
    const prompt = buildSystemPrompt('en')
    for (const locale of LOCALES) expect(prompt).toContain(`${LOCALE_NAMES[locale]} (${locale})`)
  })

  test('takes topic keys from the shared constants', () => {
    const prompt = buildSystemPrompt('en')
    expect(prompt).toContain(`e.g. ${TOPIC_KEYS[0]}`)
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
