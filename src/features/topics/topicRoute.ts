import type { Locale } from '@features/i18n'

import type { TopicKey } from './topic-keys'
import { keyToParam } from './topics'

// Route options for a topic URL, spreadable into navigate(), <Link> and redirect()
export const topicRoute = (locale: Locale, key?: TopicKey) => ({
  to: '/$locale/{-$topic}' as const,
  params: { locale, topic: key ? keyToParam(key) : undefined },
})
