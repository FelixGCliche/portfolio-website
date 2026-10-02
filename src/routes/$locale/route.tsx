import { createFileRoute, notFound, Outlet, redirect } from '@tanstack/solid-router'

import { detectLocale, isLocale } from '@features/i18n'
import { isSessionParam } from '@features/sessions'

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (isLocale(params.locale)) return
    // Legacy `/<session>` URLs: send them to `/<locale>/<session>`.
    if (isSessionParam(params.locale)) {
      throw redirect({
        to: '/$locale/{-$session}',
        params: { locale: detectLocale(), session: params.locale },
        replace: true,
      })
    }
    throw notFound()
  },
  component: () => <Outlet />,
})
