import { describe, expect, mock, test } from 'bun:test'

import { LOCALES } from '@features/i18n/locales'
import { TOPIC_KEYS } from '@features/topics/topic-keys'

import { createClientTools } from './clientTools'
import { agentTools, setLanguageTool, setThemeTool, showTopicTool, THEMES } from './tools'

const setup = () => {
  const actions = { run: mock(), setTheme: mock(), setLocale: mock() }
  const [showTopic, setTheme, setLanguage] = createClientTools(actions)
  return { actions, showTopic, setTheme, setLanguage }
}

describe('agentTools', () => {
  test('exposes definitions only, so the client runs them', () => {
    expect(agentTools.map((tool) => tool.name)).toEqual(['show_topic', 'set_theme', 'set_language'])
    for (const tool of agentTools) expect(tool.execute).toBeUndefined()
  })
})

describe('tool schemas', () => {
  test.each([...TOPIC_KEYS])('show_topic accepts %s', (key) => {
    expect(showTopicTool.inputSchema.safeParse({ key }).success).toBe(true)
  })

  test.each(['/nope', 'work', '', 42, undefined])('show_topic rejects %p', (key) => {
    expect(showTopicTool.inputSchema.safeParse({ key }).success).toBe(false)
  })

  test('set_theme accepts only known themes', () => {
    for (const theme of THEMES)
      expect(setThemeTool.inputSchema.safeParse({ theme }).success).toBe(true)
    expect(setThemeTool.inputSchema.safeParse({ theme: 'blue' }).success).toBe(false)
    expect(setThemeTool.inputSchema.safeParse({}).success).toBe(false)
  })

  test('set_language accepts only supported locales', () => {
    for (const language of LOCALES)
      expect(setLanguageTool.inputSchema.safeParse({ language }).success).toBe(true)
    expect(setLanguageTool.inputSchema.safeParse({ language: 'de' }).success).toBe(false)
    expect(setLanguageTool.inputSchema.safeParse({}).success).toBe(false)
  })
})

describe('createClientTools', () => {
  test('builds client tools for every definition', () => {
    const tools = createClientTools({ run: mock(), setTheme: mock(), setLocale: mock() })
    expect(tools.map((tool) => [tool.name, tool.__toolSide])).toEqual(
      agentTools.map((tool) => [tool.name, 'client'])
    )
  })

  test('show_topic runs the topic', async () => {
    const { actions, showTopic } = setup()
    expect(await showTopic.execute?.({ key: '/work' })).toEqual({ shown: '/work' })
    expect(actions.run).toHaveBeenCalledWith('/work')
    expect(actions.setTheme).not.toHaveBeenCalled()
  })

  test('show_topic rejects unknown keys without running', () => {
    const { actions, showTopic } = setup()
    // @ts-expect-error model output is untyped at runtime
    expect(() => showTopic.execute?.({ key: '/secret' })).toThrow()
    expect(actions.run).not.toHaveBeenCalled()
  })

  test('set_theme sets the theme', async () => {
    const { actions, setTheme } = setup()
    expect(await setTheme.execute?.({ theme: 'light' })).toEqual({ theme: 'light' })
    expect(actions.setTheme).toHaveBeenCalledWith('light')
  })

  test('set_language sets the locale', async () => {
    const { actions, setLanguage } = setup()
    expect(await setLanguage.execute?.({ language: 'fr' })).toEqual({ language: 'fr' })
    expect(actions.setLocale).toHaveBeenCalledWith('fr')
  })

  test('invalid theme or language does not call the actions', () => {
    const { actions, setTheme, setLanguage } = setup()
    // @ts-expect-error model output is untyped at runtime
    expect(() => setTheme.execute?.({ theme: 'blue' })).toThrow()
    // @ts-expect-error model output is untyped at runtime
    expect(() => setLanguage.execute?.({ language: 'de' })).toThrow()
    expect(actions.setTheme).not.toHaveBeenCalled()
    expect(actions.setLocale).not.toHaveBeenCalled()
  })
})
