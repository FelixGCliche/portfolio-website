// A URL as people read it: no protocol, no trailing slash
export const displayUrl = (url: string): string =>
  url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
