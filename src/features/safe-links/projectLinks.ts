const EMBED_HOSTS: ReadonlySet<string> = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

const VIDEO_ID = /^[\w-]{6,20}$/

/**
 * The watch page for a YouTube embed URL, e.g. `https://www.youtube.com/embed/ID` becomes
 * `https://www.youtube.com/watch?v=ID`. `undefined` when `embed` is not a YouTube embed URL.
 */
export const videoWatchUrl = (embed: string): string | undefined => {
  if (!URL.canParse(embed)) return undefined
  const url = new URL(embed)
  if (url.protocol !== 'https:' || !EMBED_HOSTS.has(url.hostname)) return undefined
  const [, kind, id, ...rest] = url.pathname.split('/')
  if (kind !== 'embed' || id === undefined || rest.length > 0 || !VIDEO_ID.test(id))
    return undefined
  return `https://www.youtube.com/watch?v=${id}`
}
