import { Link } from '@tanstack/solid-router'
import { For } from 'solid-js'

const navRoutes = ['/', '/about', '/contact', '/projects'] as const

export const Header = () => {
  return (
    <nav class="flex items-center gap-8 py-4 px-24 w-full justify-end">
      <For each={navRoutes}>
        {(route) => (
          <Link
            to={route}
            activeProps={{ class: 'text-frost-8' }}
            inactiveProps={{ class: 'text-polar-3 hover:text-frost-8' }}
            class="font-montreal-text text-sm transition-colors duration-200"
          >
            {route === '/' ? 'Home' : route.replace('/', '')}
          </Link>
        )}
      </For>
    </nav>
  )
}
