// Dependency-free (no JSX) so the agent's tool schemas and bun tests can import it.
export const THEMES = ['dark', 'light'] as const

export type Theme = (typeof THEMES)[number]

export const isTheme = (value: unknown): value is Theme =>
  typeof value === 'string' && (THEMES as readonly string[]).includes(value)
