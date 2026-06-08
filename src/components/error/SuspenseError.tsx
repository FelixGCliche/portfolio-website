import type { ErrorComponentProps } from '@tanstack/solid-router'

export const SuspenseError = ({ error, reset }: ErrorComponentProps) => {
  const message = error instanceof Error ? error.message : 'Something went wrong'

  return (
    <div class="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div class="rounded-full bg-aurora-11/10 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-aurora-11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div class="space-y-1">
        <p class="font-montreal text-lg font-semibold text-polar-0 dark:text-snow-6">Something went wrong</p>
        <p class="font-montreal-text text-sm text-polar-3 dark:text-snow-4">{message}</p>
      </div>
      <button
        onClick={reset}
        class="font-montreal cursor-pointer rounded-full bg-frost-9 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-frost-10 focus:outline-none focus:ring-2 focus:ring-frost-8 focus:ring-offset-2 dark:bg-frost-8 dark:hover:bg-frost-7"
      >
        Try again
      </button>
    </div>
  )
}
