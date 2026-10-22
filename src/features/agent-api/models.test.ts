import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  createAgentModelSource,
  MAX_AGENT_MODELS,
  MIN_CONTEXT_LENGTH,
  MODELS_CACHE_TTL_MS,
  type OpenRouterModelInfo,
  rankAgentModels,
  STATIC_AGENT_MODELS,
} from './models'

const model = (id: string, overrides: Partial<OpenRouterModelInfo> = {}): OpenRouterModelInfo => ({
  id,
  context_length: MIN_CONTEXT_LENGTH,
  pricing: { prompt: '0', completion: '0' },
  supported_parameters: ['tools', 'tool_choice'],
  ...overrides,
})

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** A fetch stub that counts calls and answers with whatever `respond` returns. */
const stubFetch = (respond: () => Response | Promise<Response>) => {
  const stub = { calls: 0 }
  const counted = async () => {
    stub.calls += 1
    return respond()
  }
  return Object.assign(counted as unknown as typeof fetch, { stub })
}

describe('rankAgentModels', () => {
  test('drops paid, non-tool-calling and small-context models', () => {
    const ids = rankAgentModels(
      [
        model('paid/model', { pricing: { prompt: '0.000001', completion: '0' } }),
        model('priced/model:free', { pricing: { prompt: '0', completion: '0.1' } }),
        model('no-suffix/model'),
        model('no-tools/model:free', { supported_parameters: ['tool_choice'] }),
        model('no-choice/model:free', { supported_parameters: ['tools'] }),
        model('small/model:free', { context_length: MIN_CONTEXT_LENGTH - 1 }),
        model('ok/model:free'),
      ],
      10
    )
    expect(ids).toEqual(['ok/model:free'])
  })

  test('puts preferred models first, in preference order, then the rest by context length', () => {
    const ids = rankAgentModels(
      [
        model('big/model:free', { context_length: 1_000_000 }),
        model('google/gemma-4-26b-a4b-it:free'),
        model('mid/model:free', { context_length: 200_000 }),
        model('google/gemma-4-31b-it:free'),
      ],
      10
    )
    expect(ids).toEqual([
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'big/model:free',
      'mid/model:free',
    ])
  })

  test(`caps the list at ${MAX_AGENT_MODELS} ids by default`, () => {
    const ids = rankAgentModels(
      Array.from({ length: MAX_AGENT_MODELS + 3 }, (_, i) => model(`m${i}/model:free`))
    )
    expect(ids).toHaveLength(MAX_AGENT_MODELS)
  })
})

describe('createAgentModelSource', () => {
  const originalError = console.error
  beforeEach(() => {
    console.error = () => undefined
  })
  afterEach(() => {
    console.error = originalError
  })

  const live = { data: [model('live/model:free'), model('other/model:free')] }

  test('returns the ranked live list', async () => {
    const fetch = stubFetch(() => jsonResponse(live))
    expect(await createAgentModelSource({ fetch })()).toEqual([
      'live/model:free',
      'other/model:free',
    ])
  })

  test('falls back to the static list on fetch errors, bad statuses, bad JSON and empty lists', async () => {
    const failures: (() => Response | Promise<Response>)[] = [
      () => Promise.reject(new Error('network down')),
      () => jsonResponse({ error: 'rate limited' }, 429),
      () => new Response('not json'),
      () =>
        jsonResponse({
          data: [model('paid/model', { pricing: { prompt: '1', completion: '1' } })],
        }),
      () => jsonResponse({}),
    ]
    for (const respond of failures) {
      expect(await createAgentModelSource({ fetch: stubFetch(respond) })()).toEqual(
        STATIC_AGENT_MODELS
      )
    }
  })

  test('reuses the cached list within the TTL', async () => {
    let time = 0
    const fetch = stubFetch(() => jsonResponse(live))
    const getModels = createAgentModelSource({ fetch, now: () => time })
    await getModels()
    time = MODELS_CACHE_TTL_MS - 1
    await getModels()
    expect(fetch.stub.calls).toBe(1)
    time = MODELS_CACHE_TTL_MS
    await getModels()
    expect(fetch.stub.calls).toBe(2)
  })

  test('prefers a stale cached list over the static list when a refresh fails', async () => {
    let time = 0
    let fail = false
    const fetch = stubFetch(() => (fail ? jsonResponse({}, 500) : jsonResponse(live)))
    const getModels = createAgentModelSource({ fetch, now: () => time })
    await getModels()
    fail = true
    time = MODELS_CACHE_TTL_MS + 1
    expect(await getModels()).toEqual(['live/model:free', 'other/model:free'])
  })

  test('shares one in-flight refresh between concurrent callers', async () => {
    const fetch = stubFetch(() => jsonResponse(live))
    const getModels = createAgentModelSource({ fetch })
    const [a, b] = await Promise.all([getModels(), getModels()])
    expect(a).toEqual(b)
    expect(fetch.stub.calls).toBe(1)
  })
})
