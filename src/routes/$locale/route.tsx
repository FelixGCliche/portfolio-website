import { createFileRoute, notFound, Outlet } from '@tanstack/solid-router'

import { isLocale } from '@features/i18n'

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) throw notFound()
  },
  component: () => <Outlet />,
})
