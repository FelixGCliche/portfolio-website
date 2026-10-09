import { describe, expect, mock, test } from 'bun:test'

import { type Locale, LOCALES } from '@features/locales'
import { type Theme, THEMES } from '@features/themes'
import { TOPIC_KEYS } from '@features/topic-keys'

import { createClientTools } from './clientTools'
import { agentTools, setLanguageTool, setThemeTool, showTopicTool } from './tools'

type SetupOptions = { theme?: Theme; locale?: Locale; requestId?: string }

const setup = ({ theme = 'dark', locale = 'en', requestId = 'r1' }: SetupOptions = {}) => {
  const state = { theme, locale, requestId }
  const actions = {
    run: mock(),
    theme: () => state.theme,
    setTheme: mock((next: Theme) => {
      state.theme = next
    }),
    locale: () => state.locale,
    setLocale: mock((next: Locale) => {
      state.locale = next
    }),
    requestId: () => state.requestId,
  }
  const [showTopic, setTheme, setLanguage] = createClientTools(actions)
  return { state, actions, showTopic, setTheme, setLanguage }
}

// Model output is untyped at runtime, so the handlers are also called with invalid arguments.
const callUntyped = (tool: { execute?: (args: never) => unknown }, args: unknown) =>
  tool.execute?.(args as never)

describe('agentTools', () => {
  test('exposes definitions only, so the client runs them', () => {
    expect(agentTools.map((tool) => tool.name)).toEqual(['show_topic', 'set_theme', 'set_language'])
    for (const tool of agentTools) expect(tool.execute).toBeUndefined()
  })

  test('describe their allowed values from the shared constants', () => {
    for (const key of TOPIC_KEYS)
      expect(JSON.stringify(showTopicTool.inputSchema.toJSONSchema())).toContain(key)
    for (const theme of THEMES) expect(setThemeTool.description).toContain(theme)
    for (const locale of LOCALES) expect(setLanguageTool.description).toContain(locale)
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
    const { showTopic, setTheme, setLanguage } = setup()
    expect([showTopic, setTheme, setLanguage].map((tool) => [tool.name, tool.__toolSide])).toEqual(
      agentTools.map((tool) => [tool.name, 'client'])
    )
  })

  test('show_topic runs the topic', async () => {
    const { actions, showTopic } = setup()
    expect(await showTopic.execute?.({ key: '/work' })).toEqual({
      key: '/work',
      status: 'applied',
    })
    expect(actions.run).toHaveBeenCalledWith('/work')
    expect(actions.setTheme).not.toHaveBeenCalled()
  })

  test('show_topic ignores a repeat within the same request', async () => {
    const { state, actions, showTopic } = setup()
    await showTopic.execute?.({ key: '/work' })
    expect(await showTopic.execute?.({ key: '/work' })).toEqual({
      key: '/work',
      status: 'unchanged',
    })
    expect(await showTopic.execute?.({ key: '/skills' })).toEqual({
      key: '/skills',
      status: 'applied',
    })
    expect(actions.run.mock.calls).toEqual([['/work'], ['/skills']])

    state.requestId = 'r2'
    expect(await showTopic.execute?.({ key: '/work' })).toEqual({
      key: '/work',
      status: 'applied',
    })
    expect(actions.run).toHaveBeenCalledTimes(3)
  })

  test('set_theme sets the theme', async () => {
    const { actions, setTheme } = setup({ theme: 'dark' })
    expect(await setTheme.execute?.({ theme: 'light' })).toEqual({
      theme: 'light',
      status: 'applied',
    })
    expect(actions.setTheme).toHaveBeenCalledWith('light')
  })

  test('set_theme to the current theme is a no-op', async () => {
    const { actions, setTheme } = setup({ theme: 'dark' })
    expect(await setTheme.execute?.({ theme: 'dark' })).toEqual({
      theme: 'dark',
      status: 'unchanged',
    })
    expect(actions.setTheme).not.toHaveBeenCalled()
  })

  test('set_theme ignores a repeat within the same request', async () => {
    const { state, actions, setTheme } = setup({ theme: 'dark' })
    await setTheme.execute?.({ theme: 'light' })
    // The theme accessor may not reflect the write yet (batched signal), so the repeat is caught by
    // the per-request dedupe.
    state.theme = 'dark'
    expect(await setTheme.execute?.({ theme: 'light' })).toEqual({
      theme: 'light',
      status: 'unchanged',
    })
    expect(actions.setTheme).toHaveBeenCalledTimes(1)
  })

  test('set_language sets the locale', async () => {
    const { actions, setLanguage } = setup({ locale: 'en' })
    expect(await setLanguage.execute?.({ language: 'fr' })).toEqual({
      language: 'fr',
      status: 'applied',
    })
    expect(actions.setLocale).toHaveBeenCalledWith('fr')
  })

  test('set_language to the current language is a no-op', async () => {
    const { actions, setLanguage } = setup({ locale: 'fr' })
    expect(await setLanguage.execute?.({ language: 'fr' })).toEqual({
      language: 'fr',
      status: 'unchanged',
    })
    expect(actions.setLocale).not.toHaveBeenCalled()
  })

  test('invalid arguments reject with a validation error without running actions', async () => {
    const { actions, showTopic, setTheme, setLanguage } = setup()
    const calls = [
      callUntyped(showTopic, { key: '/secret' }),
      callUntyped(setTheme, { theme: 'blue' }),
      callUntyped(setLanguage, { language: 'de' }),
    ]
    for (const call of calls) expect(call).toBeInstanceOf(Promise)
    await expect(calls[0]).rejects.toThrow(/^Invalid show_topic arguments: .*key/s)
    await expect(calls[1]).rejects.toThrow(/^Invalid set_theme arguments: .*theme/s)
    await expect(calls[2]).rejects.toThrow(/^Invalid set_language arguments: .*language/s)
    expect(actions.run).not.toHaveBeenCalled()
    expect(actions.setTheme).not.toHaveBeenCalled()
    expect(actions.setLocale).not.toHaveBeenCalled()
  })

  test('a failing action rejects with a tool error and can be retried', async () => {
    const { actions, showTopic } = setup()
    actions.run.mockImplementationOnce(() => {
      throw new Error('navigation blocked')
    })
    const call = showTopic.execute?.({ key: '/work' })
    expect(call).toBeInstanceOf(Promise)
    await expect(call).rejects.toThrow('show_topic failed: navigation blocked')
    expect(await showTopic.execute?.({ key: '/work' })).toEqual({
      key: '/work',
      status: 'applied',
    })
    expect(actions.run).toHaveBeenCalledTimes(2)
  })
})
