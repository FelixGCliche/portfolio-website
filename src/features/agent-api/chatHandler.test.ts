import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { type ChatEnv, handleChatRequest } from './chatHandler'
import { MAX_BODY_BYTES } from './requestGuards'

const CHAT_URL = 'https://example.com/api/chat'

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request(CHAT_URL, {
    method: 'POST',
    body,
    headers: { origin: 'https://example.com', 'cf-connecting-ip': '1.2.3.4', ...headers },
  })

const env: ChatEnv = { OPENROUTER_API_KEY: 'test-key' }

const errorOf = async (response: Response) => ({
  status: response.status,
  code: ((await response.json()) as { error: { code: string } }).error.code,
})

describe('handleChatRequest', () => {
  const originalError = console.error
  beforeEach(() => {
    console.error = () => undefined
  })
  afterEach(() => {
    console.error = originalError
  })

  test('rejects cross-origin requests', async () => {
    const response = await handleChatRequest(post('{}', { origin: 'https://evil.test' }), {
      env,
      dev: false,
    })
    expect(await errorOf(response)).toEqual({ status: 403, code: 'forbidden_origin' })
  })

  test('rejects rate-limited clients', async () => {
    const limited = { ...env, CHAT_RATE_LIMITER: { limit: async () => ({ success: false }) } }
    const response = await handleChatRequest(post('{}'), { env: limited, dev: false })
    expect(await errorOf(response)).toEqual({ status: 429, code: 'rate_limited' })
  })

  test('fails when the API key is missing', async () => {
    const response = await handleChatRequest(post('{}'), { env: {}, dev: false })
    expect(await errorOf(response)).toEqual({ status: 500, code: 'missing_api_key' })
  })

  test('rejects oversized bodies', async () => {
    const response = await handleChatRequest(post('x'.repeat(MAX_BODY_BYTES + 1)), {
      env,
      dev: false,
    })
    expect(await errorOf(response)).toEqual({ status: 413, code: 'payload_too_large' })
  })

  test('rejects invalid bodies', async () => {
    const response = await handleChatRequest(post('{not json'), { env, dev: false })
    expect(await errorOf(response)).toEqual({ status: 400, code: 'invalid_json' })
  })
})
