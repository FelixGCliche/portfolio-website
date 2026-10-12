import { createStart } from '@tanstack/solid-start'

// Client-rendered app: the server only streams the document shell (Document.tsx). Routes read
// storage/navigator/document while rendering, so they stay off the server until made SSR-safe.
export const startInstance = createStart(() => ({
  defaultSsr: false,
}))
