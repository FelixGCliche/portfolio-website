import { createRootRoute, Outlet } from '@tanstack/solid-router'

import { I18nProvider } from '@features/i18n'
import { AppLayout } from '@features/layout'

const RootLayout = () => (
  <I18nProvider>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </I18nProvider>
)

export const Route = createRootRoute({
  component: RootLayout,
})
