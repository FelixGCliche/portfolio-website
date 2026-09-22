import { createRootRoute, Outlet } from '@tanstack/solid-router'

import { AppLayout } from '@features/layout'

const RootLayout = () => (
  <AppLayout>
    <div class="mx-auto w-full px-4 py-4 sm:px-6 lg:px-10 xl:max-w-4xl">
      <Outlet />
    </div>
  </AppLayout>
)

export const Route = createRootRoute({
  component: RootLayout,
})
