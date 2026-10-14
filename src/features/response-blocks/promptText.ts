// A single-line, space-free ASCII '/command': safe to type out one monospace character per step
export const isTypableCommand = (text: string): boolean => /^\/[\x21-\x7e]+$/.test(text)
