/** Whether a tool output reports an error instead of a result. */
export const isErrorOutput = (output: unknown): boolean =>
  typeof output === 'object' && output !== null && 'error' in output

/** Whether a tool result's content (a JSON string) reports an error, e.g. rejected arguments. */
export const isErrorContent = (content: unknown): boolean => {
  if (typeof content !== 'string') return false
  try {
    return isErrorOutput(JSON.parse(content))
  } catch {
    return false
  }
}
