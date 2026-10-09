import { INVALID_REQUEST_MESSAGE, type RequestError } from './errors'

/** Largest accepted request body, in bytes. */
export const MAX_BODY_BYTES = 64 * 1024

export const PAYLOAD_TOO_LARGE_MESSAGE = 'The conversation is too long. Please start a new one.'

export type BodyReadResult = { ok: true; text: string } | ({ ok: false } & RequestError)

const invalidRequest = {
  ok: false,
  status: 400,
  code: 'invalid_request',
  message: INVALID_REQUEST_MESSAGE,
} as const

const payloadTooLarge = {
  ok: false,
  status: 413,
  code: 'payload_too_large',
  message: PAYLOAD_TOO_LARGE_MESSAGE,
} as const

/**
 * Reads a request body as text, enforcing `maxBytes` while streaming so a missing or understated
 * `Content-Length` can't make the server buffer an arbitrarily large body.
 */
export const readBodyWithLimit = async (
  request: Request,
  maxBytes: number = MAX_BODY_BYTES
): Promise<BodyReadResult> => {
  const contentLength = request.headers.get('content-length')
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength.trim())) return invalidRequest
    if (Number(contentLength) > maxBytes) return payloadTooLarge
  }

  if (!request.body) return { ok: true, text: '' }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  let text = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined)
      return payloadTooLarge
    }
    text += decoder.decode(value, { stream: true })
  }
  return { ok: true, text: text + decoder.decode() }
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

const toOrigin = (value: string | null) => {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

/**
 * Cheap same-site check: the request must come from a page on this site, judged by `Origin` (or
 * `Referer` when a browser omits it). Not a security boundary on its own, since non-browser clients
 * can forge both headers, but it stops other sites from spending the API budget through visitors'
 * browsers. In dev, requests without either header and from any localhost origin are allowed.
 */
export const isAllowedOrigin = (request: Request, dev: boolean) => {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  if (origin === null && referer === null) return dev
  // An `Origin` of `null` (sandboxed frames, file:) or an unparsable header is rejected.
  const source = toOrigin(origin ?? referer)
  if (!source) return false
  if (source === new URL(request.url).origin) return true
  return dev && LOCAL_HOSTNAMES.has(new URL(source).hostname)
}

/** The Workers rate limiting binding declared in wrangler.jsonc. */
export type RateLimiter = { limit: (options: { key: string }) => Promise<{ success: boolean }> }

/**
 * Best-effort per-IP limit through the Workers rate limiting binding. Its counters are per Cloudflare
 * location and eventually consistent, so this caps abuse rather than enforcing an exact quota; a
 * missing binding or a limiter failure lets the request through.
 */
export const isRateLimited = async (request: Request, limiter: RateLimiter | undefined) => {
  const ip = request.headers.get('cf-connecting-ip')
  if (!limiter || !ip) return false
  try {
    const { success } = await limiter.limit({ key: ip })
    return !success
  } catch (error) {
    console.error('[agent] rate limiter failed', error)
    return false
  }
}
