// Minimal typing for the Worker env bindings; secrets come from `.dev.vars` locally and
// `wrangler secret put` in production, and the rate limiter is declared in wrangler.jsonc.
declare module 'cloudflare:workers' {
  export const env: {
    OPENROUTER_API_KEY?: string
    CHAT_RATE_LIMITER?: {
      limit: (options: { key: string }) => Promise<{ success: boolean }>
    }
  }
}
