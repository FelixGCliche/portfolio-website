import { createRouter } from '@tanstack/solid-router'

import { routeTree } from './routeTree.gen'

const NotFound = () => (
  <div class="flex flex-col gap-2">
    <h1 class="text-primary text-lg">404</h1>
    <p class="text-muted-foreground text-sm">No session lives at this address.</p>
  </div>
)

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFound,
  scrollRestoration: true,
  scrollToTopSelectors: ['[role="region"][aria-label="Content"]'],
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}
