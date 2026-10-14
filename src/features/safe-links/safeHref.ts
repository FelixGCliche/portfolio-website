import { profile } from '@content'

import { TOPIC_KEYS, type TopicKey } from '@features/topic-keys'

// Free of Solid and the DOM so the Cloudflare worker can validate model output too.

/** External hosts a link may point to, matched exactly against the parsed hostname. */
const ALLOWED_HOSTS: ReadonlySet<string> = new Set([
  'github.com',
  'linkedin.com',
  'www.linkedin.com',
])

/** Query parameters a mailto link may carry; recipient-adding ones (cc, bcc, to) are refused. */
const ALLOWED_MAILTO_PARAMS: ReadonlySet<string> = new Set(['subject', 'body'])

const PROFILE_EMAILS: ReadonlySet<string> = new Set(
  profile.map((entry) => entry.email.toLowerCase())
)

// Whitespace, control characters, backslashes and invisible format characters let a link read
// one way and resolve another, so any of them rejects the href outright.
const UNSAFE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00, 0x20], // C0 controls and space
  [0x5c, 0x5c], // backslash, which URL parsing treats as a slash
  [0x7f, 0xa0], // DEL, C1 controls and no-break space
  [0xad, 0xad], // soft hyphen
  [0x1680, 0x1680],
  [0x180e, 0x180e],
  [0x2000, 0x200f], // spaces, zero-width and direction marks
  [0x2028, 0x202f], // line/paragraph separators, bidi embeddings and overrides
  [0x205f, 0x206f], // word joiner, invisible operators and bidi isolates
  [0x3000, 0x3000],
  [0xfeff, 0xfeff], // byte order mark
]

const hasUnsafeChar = (href: string): boolean => {
  for (const char of href) {
    const code = char.codePointAt(0) ?? 0
    if (UNSAFE_RANGES.some(([from, to]) => code >= from && code <= to)) return true
  }
  return false
}

const MAILTO = 'mailto:'
const HTTPS = 'https://'

/** Whether `href` is exactly one of the site's topic keys. */
export const isTopicHref = (href: string): href is TopicKey =>
  (TOPIC_KEYS as ReadonlyArray<string>).includes(href)

const isSafeMailto = (href: string): boolean => {
  const rest = href.slice(MAILTO.length)
  const queryStart = rest.indexOf('?')
  const address = queryStart === -1 ? rest : rest.slice(0, queryStart)
  if (!PROFILE_EMAILS.has(address.toLowerCase())) return false
  if (queryStart === -1) return true
  const params = new URLSearchParams(rest.slice(queryStart + 1))
  return [...params.keys()].every((key) => ALLOWED_MAILTO_PARAMS.has(key.toLowerCase()))
}

const isSafeHttps = (href: string): boolean => {
  if (!URL.canParse(href)) return false
  const url = new URL(href)
  return (
    url.protocol === 'https:' &&
    url.username === '' &&
    url.password === '' &&
    url.port === '' &&
    ALLOWED_HOSTS.has(url.hostname)
  )
}

/**
 * Whether `href` may be rendered as a link: a topic key, an https URL on an allowlisted host, or
 * a mailto to the profile's own address. Everything else (other schemes, hosts, credentials,
 * protocol-relative URLs, hidden characters) is refused.
 */
export const isSafeHref = (href: string): boolean => {
  if (typeof href !== 'string' || href.length === 0 || hasUnsafeChar(href)) return false
  if (isTopicHref(href)) return true
  if (href.startsWith(MAILTO)) return isSafeMailto(href)
  if (href.startsWith(HTTPS)) return isSafeHttps(href)
  return false
}
