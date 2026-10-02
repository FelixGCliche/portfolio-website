// Dependency-free so velite.config.ts can check the content collection against it at build time
export const SESSION_KEYS = ['/about', '/work', '/skills', '/resume', '/contact'] as const

export type SessionKey = (typeof SESSION_KEYS)[number]
