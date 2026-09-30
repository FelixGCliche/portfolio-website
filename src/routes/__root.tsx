import { createRootRoute, Outlet } from '@tanstack/solid-router'

import { AppLayout } from '@features/layout'

const RootLayout = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
)

export const Route = createRootRoute({
  component: RootLayout,
})
