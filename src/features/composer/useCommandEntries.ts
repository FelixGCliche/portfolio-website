import { commands } from '@content'
import type { Command } from '@content'
import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

import { pickSorted, useI18n } from '@features/i18n'

// Command content entries for the active locale, in content order
export const useCommandEntries = (): Accessor<Command[]> => {
  const i18n = useI18n()
  return createMemo(() => pickSorted(commands, i18n.locale()), { name: 'commandEntries' })
}
