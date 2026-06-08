import { Link } from '@tanstack/solid-router'

export const NotFoundError = () => (
  <div class="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
    <div class="space-y-4">
      <p class="font-eiko text-9xl font-light italic text-polar-3">404</p>
      <div class="space-y-6">
        <p class="font-eiko text-4xl font-light text-polar-0 dark:text-snow-6">Page not found</p>
        <p class="font-montreal-text text-sm text-polar-3">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" class="font-montreal-text text-sm text-frost-8">
          Back to Home
        </Link>
      </div>
    </div>
  </div>
)
