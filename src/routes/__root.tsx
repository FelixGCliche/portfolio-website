import { Link, Outlet, createRootRoute } from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    )
  },
})

function RootComponent() {
  return (
    <>
      <Outlet />
      {/* Start rendering router matches */}
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}
