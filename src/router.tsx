import { createRouter } from '@tanstack/solid-router'

import { NotFound } from '@features/not-found'

import { routeTree } from './routeTree.gen'

export const getRouter = () =>
  createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
  })

declare module '@tanstack/solid-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
