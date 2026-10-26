import { describe, expect, test } from 'bun:test'

import { buildResumeMarkdown } from './resumeMarkdown'

const input = {
  profile: {
    name: 'Jane Doe',
    role: 'Developer',
    location: 'Montreal',
    email: 'jane@example.com',
    github: 'github.com/jane',
    linkedin: 'linkedin.com/in/jane',
  },
  summary: 'Builds things.\n',
  roles: [
    { title: 'Dev', company: 'Acme', start: '2023-05', end: '2024-04' },
    { title: 'Lead', company: 'Beta', start: '2024-05', end: null },
  ],
  education: { degree: 'BSc', school: 'UdeM', start: 2018, end: 2021 },
  skills: [{ area: 'Frontend', tools: ['Solid', 'TypeScript'] }],
  labels: {
    experience: 'experience',
    education: 'education',
    skills: 'skills',
    present: 'present',
    profile: 'profile',
  },
}

describe('buildResumeMarkdown', () => {
  test('renders all sections', () => {
    const md = buildResumeMarkdown(input)
    expect(md).toContain('# Jane Doe\n\nDeveloper · Montreal\n')
    expect(md).toContain('jane@example.com · github.com/jane · linkedin.com/in/jane')
    expect(md).toContain('## profile\n\nBuilds things.\n')
    expect(md).toContain('- **Dev** @ Acme (2023-05 → 2024-04)')
    expect(md).toContain('- **Lead** @ Beta (2024-05 → present)')
    expect(md).toContain('## education\n\n- **BSc** @ UdeM (2018 → 2021)')
    expect(md).toContain('- **Frontend:** Solid · TypeScript')
    expect(md.endsWith('\n')).toBe(true)
  })
})
