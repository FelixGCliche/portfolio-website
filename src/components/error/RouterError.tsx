import { createSignal } from 'solid-js'
import type { ErrorComponentProps } from '@tanstack/solid-router'

export const RouterError = ({ error }: ErrorComponentProps) => {
  const [show, setShow] = createSignal(false)
  const message = error instanceof Error ? error.message : 'Something went wrong'

  return (
    <div class="mx-auto flex max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <p class="font-montreal text-base font-semibold text-polar-0 dark:text-snow-6">Something went wrong</p>
      <p class="font-montreal-text text-sm text-polar-3 dark:text-snow-4">{message}</p>
      <button
        onClick={() => setShow((d) => !d)}
        class="font-montreal cursor-pointer text-xs text-frost-9 underline underline-offset-2 hover:text-frost-10 focus:outline-none dark:text-frost-8 dark:hover:text-frost-7"
      >
        {show() ? 'Hide details' : 'Show details'}
      </button>
      {show() && (
        <pre class="w-full overflow-auto rounded-lg border border-polar-3 bg-polar-0/5 p-3 text-left text-xs text-aurora-11 dark:border-polar-3 dark:bg-snow-6/5 dark:text-aurora-11">
          <code>{error instanceof Error ? (error.stack ?? error.message) : String(error)}</code>
        </pre>
      )}
    </div>
  )
}
