import { Outlet, createRootRoute } from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { SuspenseError } from '../components/error/SuspenseError'
import { NotFoundError } from '../components/error/NotFoundError'

const RootComponent = () => (
  <>
    <Outlet />
    <TanStackRouterDevtools position="bottom-right" />
  </>
)

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: SuspenseError,
  notFoundComponent: NotFoundError,
})
