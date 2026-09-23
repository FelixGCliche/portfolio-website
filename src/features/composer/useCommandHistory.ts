export const useCommandHistory = () => {
  const entries: string[] = []
  let cursor = 0
  let draft = ''

  const reset = () => {
    cursor = entries.length
    draft = ''
  }

  const push = (entry: string) => {
    if (entries.at(-1) !== entry) entries.push(entry)
    reset()
  }

  const prev = (currentValue: string): string | undefined => {
    if (cursor === 0) return undefined
    if (cursor === entries.length) draft = currentValue
    cursor -= 1
    return entries[cursor]
  }

  const next = (): string | undefined => {
    if (cursor >= entries.length) return undefined
    cursor += 1
    return cursor === entries.length ? draft : entries[cursor]
  }

  return { push, prev, next, reset }
}
