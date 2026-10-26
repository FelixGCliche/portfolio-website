const MODELS_URL = 'https://openrouter.ai/api/v1/models?supported_parameters=tools'

/** Smallest context window a model needs: the system prompt alone is large. */
export const MIN_CONTEXT_LENGTH = 128_000
/**
 * Most model ids sent per request: the primary `model` plus `models` fallbacks. OpenRouter documents
 * no cap for `models` but caps its other fallback list at 3, so stay at 3 in total.
 */
export const MAX_AGENT_MODELS = 3
/** How long a fetched model list is reused; Worker isolates live across requests. */
export const MODELS_CACHE_TTL_MS = 10 * 60 * 1000
const MODELS_FETCH_TIMEOUT_MS = 3000

/** Free models that reliably call tools, tried first in this order when available. */
export const PREFERRED_AGENT_MODELS: readonly string[] = [
  'nvidia/nemotron-3.5-super-vl:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'poolside/laguna-s-2.1:free',
  'cohere/north-mini-code:free',
]

/**
 * OpenRouter's free router: picks any currently available free model that supports the request.
 * Always the last fallback so the request survives every ranked model being rate limited or down.
 */
export const FREE_ROUTER_MODEL = 'openrouter/free'

/** Used when the live model list can't be fetched and nothing is cached. */
export const STATIC_AGENT_MODELS: readonly string[] = [
  ...PREFERRED_AGENT_MODELS.slice(0, MAX_AGENT_MODELS - 1),
  FREE_ROUTER_MODEL,
]

/** The fields read from an entry of OpenRouter's `/models` response. */
export type OpenRouterModelInfo = {
  id: string
  context_length?: number | null
  pricing?: { prompt?: string; completion?: string } | null
  supported_parameters?: readonly string[] | null
}

const isUsable = (model: OpenRouterModelInfo) =>
  typeof model.id === 'string' &&
  model.id.endsWith(':free') &&
  model.pricing?.prompt === '0' &&
  model.pricing.completion === '0' &&
  (model.supported_parameters?.includes('tools') ?? false) &&
  (model.supported_parameters?.includes('tool_choice') ?? false) &&
  (model.context_length ?? 0) >= MIN_CONTEXT_LENGTH

/**
 * Keeps free, tool-calling models with a large enough context, preferred models first (in preference
 * order) and the rest by context length, longest first. Returns at most `limit` ids.
 */
export const rankAgentModels = (
  models: readonly OpenRouterModelInfo[],
  limit = MAX_AGENT_MODELS
): string[] => {
  const usable = models.filter(isUsable)
  const rankOf = (id: string) => {
    const index = PREFERRED_AGENT_MODELS.indexOf(id)
    return index === -1 ? PREFERRED_AGENT_MODELS.length : index
  }
  const ranked = [...usable].sort(
    (a, b) => rankOf(a.id) - rankOf(b.id) || (b.context_length ?? 0) - (a.context_length ?? 0)
  )
  return [...new Set(ranked.map((model) => model.id))].slice(0, limit)
}

const fetchAgentModels = async (fetchFn: typeof fetch): Promise<string[]> => {
  const response = await fetchFn(MODELS_URL, {
    signal: AbortSignal.timeout(MODELS_FETCH_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`model list request failed with status ${response.status}`)
  const body = (await response.json()) as { data?: unknown }
  if (!Array.isArray(body?.data)) throw new Error('model list response has no data array')
  const ids = rankAgentModels(body.data as OpenRouterModelInfo[], MAX_AGENT_MODELS - 1)
  if (ids.length === 0) throw new Error('model list has no usable models')
  return [...ids, FREE_ROUTER_MODEL]
}

export type AgentModelSourceOptions = {
  fetch?: typeof fetch
  now?: () => number
}

/**
 * Creates a getter for the ordered agent model ids (primary first, then fallbacks). The list is
 * cached for {@link MODELS_CACHE_TTL_MS}; a failed refresh falls back to the stale list, then to
 * {@link STATIC_AGENT_MODELS}. Never throws.
 */
export const createAgentModelSource = ({
  fetch: fetchFn = globalThis.fetch,
  now = Date.now,
}: AgentModelSourceOptions = {}) => {
  let cached: { ids: readonly string[]; fetchedAt: number } | undefined
  let inFlight: Promise<readonly string[]> | undefined

  const refresh = async (): Promise<readonly string[]> => {
    try {
      const ids = await fetchAgentModels(fetchFn)
      cached = { ids, fetchedAt: now() }
      return ids
    } catch (error) {
      console.error('[agent] failed to load model list', error)
      return cached?.ids ?? STATIC_AGENT_MODELS
    }
  }

  return (): Promise<readonly string[]> => {
    if (cached && now() - cached.fetchedAt < MODELS_CACHE_TTL_MS) return Promise.resolve(cached.ids)
    inFlight ??= refresh().finally(() => {
      inFlight = undefined
    })
    return inFlight
  }
}

/** Ordered agent model ids for this isolate, shared across requests. */
export const getAgentModels = createAgentModelSource()
