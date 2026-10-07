import { describe, expect, test } from 'bun:test'

import { about, education, profile, roles, skills, topics } from '@content'

import { LOCALES } from '@features/i18n/locales'

import { buildSystemPrompt, htmlToText, type PromptContent } from './systemPrompt'

const MAX_PROMPT_CHARS = 12_000

const content: PromptContent = { profile, about, roles, skills, topics, education }

describe('buildSystemPrompt', () => {
  test('asks for replies in the requested locale', () => {
    expect(buildSystemPrompt('en')).toContain('Always reply in English')
    expect(buildSystemPrompt('fr')).toContain('Always reply in French')
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

  test.each([...LOCALES])('has no empty sections or HTML in %s', (locale) => {
    const lines = buildSystemPrompt(locale).split('\n')
    lines.forEach((line, i) => {
      if (line.startsWith('## ')) expect(lines[i + 1]?.trim()).toBeTruthy()
    })
    expect(lines.join('\n')).not.toMatch(/<\/?[a-z][^>]*>/i)
    expect(lines.join('\n')).not.toContain('undefined')
  })

  test.each([...LOCALES])('stays within a reasonable size in %s', (locale) => {
    expect(buildSystemPrompt(locale).length).toBeLessThan(MAX_PROMPT_CHARS)
  })

  test('omits sections with no entries', () => {
    const prompt = buildSystemPrompt('en', { ...content, roles: [], skills: [] })
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

describe('htmlToText', () => {
  test('strips tags into paragraphs and decodes entities', () => {
    expect(
      htmlToText('<p>Hi &amp; <strong>bye</strong></p>\n<p>It&#x27;s &#233;t&eacute;</p>')
    ).toBe("Hi & bye\nIt's ét&eacute;")
  })
})
