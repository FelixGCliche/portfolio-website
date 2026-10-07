import { ChatClient, fetchServerSentEvents } from '@tanstack/ai-client'
import type {
  ChatClientState,
  MultimodalContent,
  SendMessageOptions,
  UIMessage,
} from '@tanstack/ai-client'
import type { AnyClientTool } from '@tanstack/ai/client'
import { createSignal, onCleanup, onSettled } from 'solid-js'

export const CHAT_ENDPOINT = '/api/chat'

export type UseAgentChatOptions<TTools extends ReadonlyArray<AnyClientTool>> = {
  /** Browser-side tool implementations the agent may call. */
  tools?: TTools
  /** Initial `forwardedProps` sent with every request; replace later with `updateBody`. */
  body?: Record<string, unknown>
  /** Chat endpoint, defaults to {@link CHAT_ENDPOINT}. */
  url?: string
}

/**
 * Solid 2 wrapper around `@tanstack/ai-client`'s `ChatClient`. The client is created once the
 * owner settles (browser only) and disposed with it. Its state is mirrored into named signals that
 * are written only from the client's callbacks, never from a reactive scope.
 */
export const useAgentChat = <const TTools extends ReadonlyArray<AnyClientTool>>(
  options: UseAgentChatOptions<TTools> = {}
) => {
  const [messages, setMessages] = createSignal<UIMessage<TTools>[]>([], {
    name: 'agentMessages',
    equals: false,
  })
  const [isLoading, setIsLoading] = createSignal(false, { name: 'agentIsLoading' })
  const [status, setStatus] = createSignal<ChatClientState>('ready', { name: 'agentStatus' })
  const [error, setError] = createSignal<Error | undefined>(undefined, { name: 'agentError' })

  let client: ChatClient<TTools> | undefined
  let body: Record<string, unknown> = options.body ?? {}

  onSettled(() => {
    const instance: ChatClient<TTools> = new ChatClient<TTools>({
      connection: fetchServerSentEvents(options.url ?? CHAT_ENDPOINT),
      tools: options.tools,
      forwardedProps: body,
      // Callbacks after teardown (stop/dispose) or from a replaced client are ignored.
      onMessagesChange: (next) => {
        if (client === instance) setMessages(next)
      },
      onLoadingChange: (next) => {
        if (client === instance) setIsLoading(next)
      },
      onStatusChange: (next) => {
        if (client === instance) setStatus(next)
      },
      onErrorChange: (next) => {
        if (client === instance) setError(next)
      },
    })
    client = instance
    instance.attach()
  })

  onCleanup(() => {
    const instance = client
    client = undefined
    if (!instance) return
    instance.stop()
    instance.detach()
    instance.dispose()
  })

  /** Sends a user message; `content.id` lets the caller correlate the reply. */
  const sendMessage = (content: string | MultimodalContent, sendOptions?: SendMessageOptions) =>
    client?.sendMessage(content, undefined, sendOptions) ?? Promise.resolve()

  /** Re-runs the last user message. */
  const reload = () => client?.reload() ?? Promise.resolve()

  /** Aborts the stream in flight. */
  const stop = () => client?.stop()

  /** Drops the whole transcript (and any stream in flight). */
  const clear = () => {
    client?.stop()
    client?.clear()
  }

  /** Replaces the `forwardedProps` sent with every following request. */
  const updateBody = (next: Record<string, unknown>) => {
    body = next
    client?.updateOptions({ forwardedProps: next })
  }

  return { messages, isLoading, status, error, sendMessage, reload, stop, clear, updateBody }
}

export type AgentChat = ReturnType<typeof useAgentChat>
