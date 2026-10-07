// Minimal typing for the Worker env binding; secrets come from `.dev.vars` locally and
// `wrangler secret put` in production.
declare module 'cloudflare:workers' {
  export const env: {
    OPENROUTER_API_KEY?: string
  }
}
