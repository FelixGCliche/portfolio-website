import { useRouter, useRouterState } from '@tanstack/solid-router'

export const Header = () => {
  const router = useRouter()
  const routerState = useRouterState()

  console.log(router)
  console.log(routerState)

  return (
    <div class="flex p-3">
      <p class="font-montreal-text text-sm">This is a header</p>
    </div>
  )
}
