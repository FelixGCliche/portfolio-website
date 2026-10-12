import { createRootRoute, Outlet } from '@tanstack/solid-router'

import { I18nProvider } from '@features/i18n'
import { AppLayout } from '@features/layout'

import Document from '../Document'

import appCss from '../App.css?url'

const RootLayout = () => (
  <I18nProvider>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </I18nProvider>
)

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: Document,
  component: RootLayout,
})
