import { createFileRoute, redirect } from '@tanstack/solid-router'

import { detectLocale } from '@features/i18n'

// detectLocale() is SSR-safe: without `window` it returns the default locale.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: '/$locale/{-$session}',
      params: { locale: detectLocale() },
      replace: true,
    })
  },
})
