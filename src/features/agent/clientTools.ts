import type { Locale } from '@features/i18n/locales'
import type { Theme } from '@features/preferences'
import type { TopicKey } from '@features/topics/topic-keys'

import { setLanguageTool, setThemeTool, showTopicTool } from './tools'

/** The app actions the agent's UI tools drive, injected so this module stays provider-free. */
export type ClientToolActions = {
  /** Shows a topic in the conversation (ConversationProvider's `run`). */
  run: (key: TopicKey) => void
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
}

/**
 * Browser implementations of the agent's UI tools. Arguments come from the model, so each one is
 * re-validated against its schema before an action runs; invalid calls throw and are reported back
 * to the model as tool errors.
 */
export const createClientTools = ({ run, setTheme, setLocale }: ClientToolActions) =>
  [
    showTopicTool.client((args) => {
      const { key } = showTopicTool.inputSchema.parse(args)
      run(key)
      return { shown: key }
    }),
    setThemeTool.client((args) => {
      const { theme } = setThemeTool.inputSchema.parse(args)
      setTheme(theme)
      return { theme }
    }),
    setLanguageTool.client((args) => {
      const { language } = setLanguageTool.inputSchema.parse(args)
      setLocale(language)
      return { language }
    }),
  ] as const
