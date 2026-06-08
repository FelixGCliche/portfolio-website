import { Outlet, createFileRoute } from '@tanstack/solid-router'
import { SuspenseError } from '../components/error/SuspenseError'

const LayoutComponent = () => (
  <div class="p-2">
    <div class="border-b">I'm a layout</div>
    <div>
      <Outlet />
    </div>
  </div>
)

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
  errorComponent: SuspenseError,
})
