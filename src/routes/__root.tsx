import { Outlet, createRootRoute } from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { SuspenseError, NotFoundError } from '@components/error'
import { Header } from '@features/navigation'

const RootComponent = () => (
  <>
    <Header />
    <Outlet />
    <TanStackRouterDevtools position="bottom-right" />
  </>
)

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: SuspenseError,
  notFoundComponent: NotFoundError,
})
