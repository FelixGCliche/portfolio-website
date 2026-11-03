// Free of path aliases and content imports so velite.config.ts can validate project content with it.

const EMBED_HOSTS: ReadonlySet<string> = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

/** Hosts a project's watch link may point to. */
const WATCH_HOSTS: ReadonlySet<string> = new Set(['youtube.com', 'www.youtube.com', 'youtu.be'])

/** The reviewed host for project play pages; any of its subdomains (a creator's page) qualifies. */
const PLAY_DOMAIN = 'itch.io'

const VIDEO_ID = /^[\w-]{6,20}$/
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

const parseHttpsUrl = (href: string): URL | undefined => {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return undefined
  }
  const plain =
    url.protocol === 'https:' && url.username === '' && url.password === '' && url.port === ''
  return plain ? url : undefined
}

const isPlayHost = (hostname: string): boolean => {
  if (hostname === PLAY_DOMAIN) return true
  if (!hostname.endsWith(`.${PLAY_DOMAIN}`)) return false
  const sub = hostname.slice(0, -(PLAY_DOMAIN.length + 1))
  return sub.split('.').every((label) => HOST_LABEL.test(label))
}

/** Whether `hostname` is a reviewed host a project play or watch page may live on. */
export const isProjectHost = (hostname: string): boolean =>
  isPlayHost(hostname) || WATCH_HOSTS.has(hostname)

/** Whether `href` is an acceptable project play page: a plain https URL on itch.io. */
export const isProjectPlayUrl = (href: string): boolean => {
  const url = parseHttpsUrl(href)
  return url !== undefined && isPlayHost(url.hostname)
}

/**
 * The watch page for a YouTube embed URL, e.g. `https://www.youtube.com/embed/ID` becomes
 * `https://www.youtube.com/watch?v=ID`. `undefined` when `embed` is not a YouTube embed URL.
 */
export const videoWatchUrl = (embed: string): string | undefined => {
  const url = parseHttpsUrl(embed)
  if (!url || !EMBED_HOSTS.has(url.hostname)) return undefined
  const [, kind, id, ...rest] = url.pathname.split('/')
  if (kind !== 'embed' || id === undefined || rest.length > 0 || !VIDEO_ID.test(id))
    return undefined
  return `https://www.youtube.com/watch?v=${id}`
}

/** Whether `href` is an acceptable project video: an https YouTube embed URL. */
export const isProjectVideoUrl = (href: string): boolean => videoWatchUrl(href) !== undefined

/** The play and watch pages of `projects` that pass the project host checks. */
export const projectPageUrls = (
  projects: ReadonlyArray<{ url?: string; video?: string }>
): string[] =>
  projects.flatMap((project) => [
    ...(project.url && isProjectPlayUrl(project.url) ? [project.url] : []),
    ...(project.video ? [videoWatchUrl(project.video)].filter((href) => href !== undefined) : []),
  ])
