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

/** Lowercases and drops the scheme, a leading `www.` and trailing slashes, punctuation and query. */
const normalizeUrl = (value: string) =>
  value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[?#].*$/, '')
    .replace(/[/.,;:!)]+$/, '')

const hostOf = (normalized: string) => normalized.split('/')[0] ?? ''

/**
 * Whether a link's shown `text` only names the place `href` goes: every email address in it must
 * be the mailto recipient, and every URL or domain in it must be the href itself or its host.
 * Text such as "GitHub" or a handle carries neither and always passes.
 */
export const linkTextMatchesHref = (text: string, href: string): boolean => {
  const recipient = mailtoRecipient(href)
  const emails = text.match(EMAIL) ?? []
  if (emails.some((email) => email.toLowerCase() !== recipient)) return false

  const target = recipient === undefined ? normalizeUrl(href) : undefined
  const urls = text.replace(EMAIL, ' ').match(URL_LIKE) ?? []
  return urls.every((url) => {
    if (target === undefined) return false
    const shown = normalizeUrl(url)
    return shown === target || shown === hostOf(target)
  })
}
