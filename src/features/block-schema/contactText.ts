import { profile } from '@content'

import { mailtoRecipient } from '@features/safe-links'

// Free of Solid and the DOM so the Cloudflare worker can validate model output too.

/** Phone-shaped runs: international (+…), 10-digit North American and 7-digit local numbers. */
const PHONE_PATTERNS: ReadonlyArray<RegExp> = [
  /\+\s*\d[\d\s().-]{6,}\d/,
  /(?<!\d)\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/,
  /(?<!\d)\d{3}[\s.-]\d{4}(?!\d)/,
]

// Digits joined only by phone punctuation (spaces, - . ( ) +) form one run.
const PHONE_RUN = /\+?\d(?:[\s().+-]{0,3}\d)*/g

const digitsOf = (value: string) => value.replace(/\D/g, '')

// The last 7 digits of each profile phone number, caught even when spaced or punctuated oddly.
const PROFILE_PHONE_DIGITS: ReadonlyArray<string> = [
  ...new Set(profile.map((entry) => digitsOf(entry.phone).slice(-7)).filter((d) => d.length >= 7)),
]

/** Whether `text` holds anything that reads as a phone number, or the profile's own number. */
export const containsPhoneNumber = (text: string): boolean => {
  if (PHONE_PATTERNS.some((pattern) => pattern.test(text))) return true
  // Only digits joined by phone punctuation form one number; other text keeps runs apart.
  const runs = (text.match(PHONE_RUN) ?? []).map(digitsOf)
  return PROFILE_PHONE_DIGITS.some((phone) => runs.some((digits) => digits.includes(phone)))
}

const EMAIL = /[^\s@<>()[\]"',;:]+@[^\s@<>()[\]"',;:]+\.[^\s@<>()[\]"',;:]+/g
// Tech names that end like a TLD but are not domains (Vue.js, Next.js, ...).
const URL_LIKE =
  /(?:https?:\/\/|www\.)[^\s]+|(?<![\w@.-])(?:[a-z0-9-]+\.)+(?!(?:js|jsx|ts|tsx|mjs|cjs|json|css|html|vue|java|php|rb)(?![\w-]))[a-z]{2,24}(?![\w-])(?:[/?#][^\s]*)?/gi

const YOUTUBE_HOST = 'youtube.com'
const YOUTUBE_SHORT_HOST = 'youtu.be'

/** A URL reduced to what identifies the page: host without `www.`, path and any video id. */
type PageId = { host: string; path: string; video?: string }

/**
 * Parses a URL or bare `host/path` into its `PageId`, ignoring scheme, case (except the video id),
 * trailing slashes and punctuation, the fragment and every query parameter but YouTube's `v`.
 */
const pageIdOf = (value: string): PageId | undefined => {
  const trimmed = value.replace(/[.,;:!)]+$/, '')
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return undefined
  }
  const host = url.hostname.replace(/^www\./, '')
  if (host === YOUTUBE_SHORT_HOST) {
    const video = url.pathname.split('/')[1]
    return video ? { host: YOUTUBE_HOST, path: '/watch', video } : { host, path: '' }
  }
  const path = url.pathname.replace(/\/+$/, '').toLowerCase()
  const video = host === YOUTUBE_HOST ? (url.searchParams.get('v') ?? undefined) : undefined
  return video ? { host, path, video } : { host, path }
}

// The host's last two labels, e.g. itch.io for incrediboldstudio.itch.io.
const domainOf = (host: string) => host.split('.').slice(-2).join('.')

const pathOf = (page: PageId) => `${page.path}${page.video ? `?v=${page.video}` : ''}`

/**
 * The URL-like forms link text may show for an https `href`, most specific first: the full URL
 * without scheme, the domain with the path, the host and the bare domain.
 */
const shownFormsOf = (page: PageId): string[] => [
  ...new Set([
    `${page.host}${pathOf(page)}`,
    `${domainOf(page.host)}${pathOf(page)}`,
    page.host,
    domainOf(page.host),
  ]),
]

/**
 * Addresses a link's shown text may contain for `href`: the mailto recipient, or the URL forms
 * `linkTextMatchesHref` accepts. Empty when `href` is neither a mailto nor a URL.
 */
export const expectedLinkText = (href: string): string[] => {
  const recipient = mailtoRecipient(href)
  if (recipient !== undefined) return [recipient]
  const page = pageIdOf(href)
  return page ? shownFormsOf(page) : []
}

/**
 * Whether a link's shown `text` only names the place `href` goes: every email address in it must
 * be the mailto recipient, and every URL or domain in it must name the href (full URL, domain
 * with path, host or bare domain; a YouTube video id must match). Text such as "GitHub" or a
 * handle carries neither and always passes.
 */
export const linkTextMatchesHref = (text: string, href: string): boolean => {
  const recipient = mailtoRecipient(href)
  const emails = text.match(EMAIL) ?? []
  if (emails.some((email) => email.toLowerCase() !== recipient)) return false

  const target = recipient === undefined ? pageIdOf(href) : undefined
  const accepted = new Set(target ? shownFormsOf(target) : [])
  const urls = text.replace(EMAIL, ' ').match(URL_LIKE) ?? []
  return urls.every((url) => {
    const shown = pageIdOf(url)
    return shown !== undefined && accepted.has(`${shown.host}${pathOf(shown)}`)
  })
}
