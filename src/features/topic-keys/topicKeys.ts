// Dependency-free so velite.config.ts can check the content collection against it at build time
export const TOPIC_KEYS = ['/about', '/work', '/skills', '/resume', '/contact'] as const

export type TopicKey = (typeof TOPIC_KEYS)[number]
