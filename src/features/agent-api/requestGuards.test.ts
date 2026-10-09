import { describe, expect, test } from 'bun:test'

import { isAllowedOrigin, isRateLimited, readBodyWithLimit } from './requestGuards'

const CHAT_URL = 'https://example.com/api/chat'

const streamOf = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk))
      controller.close()
    },
  })

const post = (body: BodyInit, headers: Record<string, string> = {}) =>
  new Request(CHAT_URL, { method: 'POST', body, headers, duplex: 'half' } as RequestInit)

describe('readBodyWithLimit', () => {
  test('reads a body within the limit', async () => {
    expect(await readBodyWithLimit(post('{"a":1}'), 16)).toEqual({ ok: true, text: '{"a":1}' })
  })

  test('rejects a declared Content-Length over the limit', async () => {
    const result = await readBodyWithLimit(post('x', { 'content-length': '100' }), 16)
    expect(result).toMatchObject({ ok: false, status: 413, code: 'payload_too_large' })
  })

  test('rejects an invalid Content-Length', async () => {
    for (const value of ['abc', '-1', '1.5']) {
      const request = new Request(CHAT_URL, { method: 'POST', body: 'x' })
      // Request normally sets Content-Length itself; override it to simulate a hostile client.
      Object.defineProperty(request, 'headers', { value: new Headers({ 'content-length': value }) })
      const result = await readBodyWithLimit(request, 16)
      expect(result).toMatchObject({ ok: false, status: 400, code: 'invalid_request' })
    }
  })

  test('enforces the limit while streaming when Content-Length is missing', async () => {
    const result = await readBodyWithLimit(post(streamOf(['a'.repeat(10), 'b'.repeat(10)])), 16)
    expect(result).toMatchObject({ ok: false, status: 413, code: 'payload_too_large' })
  })

  test('decodes multi-byte characters split across chunks', async () => {
    const bytes = new TextEncoder().encode('é')
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 1))
        controller.enqueue(bytes.slice(1))
        controller.close()
      },
    })
    expect(await readBodyWithLimit(post(body), 16)).toEqual({ ok: true, text: 'é' })
  })
})

describe('isAllowedOrigin', () => {
  const request = (headers: Record<string, string>) =>
    new Request(CHAT_URL, { method: 'POST', headers })

  test('allows same-origin requests', () => {
    expect(isAllowedOrigin(request({ origin: 'https://example.com' }), false)).toBe(true)
    expect(isAllowedOrigin(request({ referer: 'https://example.com/work' }), false)).toBe(true)
  })

  test('rejects cross-origin, opaque and missing origins in production', () => {
    expect(isAllowedOrigin(request({ origin: 'https://evil.test' }), false)).toBe(false)
    expect(isAllowedOrigin(request({ origin: 'null' }), false)).toBe(false)
    expect(isAllowedOrigin(request({}), false)).toBe(false)
  })

  test('is permissive with localhost and missing origins in dev', () => {
    expect(isAllowedOrigin(request({}), true)).toBe(true)
    expect(isAllowedOrigin(request({ origin: 'http://localhost:5173' }), true)).toBe(true)
    expect(isAllowedOrigin(request({ origin: 'https://evil.test' }), true)).toBe(false)
  })
})

describe('isRateLimited', () => {
  const request = (headers: Record<string, string> = { 'cf-connecting-ip': '1.2.3.4' }) =>
    new Request(CHAT_URL, { method: 'POST', headers })
  const limiter = (limit: () => Promise<{ success: boolean }>) => ({ limit })

  test('reports the limiter verdict', async () => {
    expect(
      await isRateLimited(
        request(),
        limiter(async () => ({ success: false }))
      )
    ).toBe(true)
    expect(
      await isRateLimited(
        request(),
        limiter(async () => ({ success: true }))
      )
    ).toBe(false)
  })

  test('lets the request through without a binding, an IP or a working limiter', async () => {
    const failing = limiter(() => Promise.reject(new Error('down')))
    const originalError = console.error
    console.error = () => undefined
    try {
      expect(await isRateLimited(request(), undefined)).toBe(false)
      expect(await isRateLimited(request({}), failing)).toBe(false)
      expect(await isRateLimited(request(), failing)).toBe(false)
    } finally {
      console.error = originalError
    }
  })
})
