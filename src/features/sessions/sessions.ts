export const SESSION_KEYS = ['/about', '/work', '/skills', '/resume', '/contact'] as const

export type SessionKey = (typeof SESSION_KEYS)[number]

export type Session = {
  key: SessionKey
  meta: string
  desc: string
}

export const sessions: Session[] = [
  { key: '/about', meta: '5y', desc: 'How I got here, briefly' },
  { key: '/work', meta: '4 roles', desc: 'What I shipped, and where' },
  { key: '/skills', meta: '6 areas', desc: 'The toolbox, honestly rated' },
  { key: '/resume', meta: 'pdf', desc: 'The full CV, downloadable' },
  { key: '/contact', meta: 'open', desc: 'Same-day answer, promised' },
]
