import type { AnyTool } from '@tanstack/ai'

/**
 * Tool definitions shared by the chat route and the client. Empty until the UI tools land; add
 * `toolDefinition()`s here and the chat route passes them to the model unchanged.
 */
export const agentTools: ReadonlyArray<AnyTool> = []
