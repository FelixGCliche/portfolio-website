import { createRouter } from '@tanstack/solid-router'

import { NotFound } from '@features/not-found'

import { routeTree } from './routeTree.gen'

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
