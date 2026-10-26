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
    { title: 'Dev', company: 'Acme', start: '2023-05', end: '2024-04', bullets: ['Shipped it'] },
    { title: 'Lead', company: 'Beta', start: '2024-05', end: null, bullets: [] },
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
    expect(md).toContain('## Profile\n\nBuilds things.\n')
    expect(md).toContain('## Experience\n\n')
    expect(md).toContain('- **Dev** @ Acme (2023-05 → 2024-04)\n  - Shipped it\n- **Lead**')
    expect(md).toContain('- **Lead** @ Beta (2024-05 → present)')
    expect(md).toContain('## Education\n\n- **BSc** @ UdeM (2018 → 2021)')
    expect(md).toContain('## Skills\n\n- **Frontend:** Solid · TypeScript')
    expect(md.endsWith('\n')).toBe(true)
  })

  test('escapes markdown syntax in titles, names and tools', () => {
    const md = buildResumeMarkdown({
      ...input,
      roles: [
        {
          title: '*Star* dev',
          company: 'C# Co',
          start: '2023-05',
          end: null,
          bullets: ['Used *bold* _it_'],
        },
      ],
      education: { degree: 'B_Sc', school: '[UdeM]', start: 2018, end: 2021 },
      skills: [{ area: 'Back_end', tools: ['C#', 'Node_js', '<T>'] }],
    })
    expect(md).toContain('- **\\*Star\\* dev** @ C\\# Co (2023-05 → present)')
    expect(md).toContain('  - Used \\*bold\\* \\_it\\_')
    expect(md).toContain('- **B\\_Sc** @ \\[UdeM\\] (2018 → 2021)')
    expect(md).toContain('- **Back\\_end:** C\\# · Node\\_js · \\<T\\>')
  })

  test('escapes tables, entities, links, strikethrough and list markers', () => {
    const md = buildResumeMarkdown({
      ...input,
      roles: [
        {
          title: 'A|B & C',
          company: '![x](y) ~~z~~',
          start: '2023-05',
          end: null,
          bullets: ['- nested', '+ plus', '1. ordered', 'trailing -', 'mid-word C++ a+b', 'a\\-'],
        },
      ],
      skills: [{ area: 'Tools', tools: ['-', 'C++'] }],
    })
    expect(md).toContain('- **A\\|B \\& C** @ \\!\\[x\\]\\(y\\) \\~\\~z\\~\\~ (2023-05 → present)')
    expect(md).toContain('  - \\- nested\n')
    expect(md).toContain('  - \\+ plus\n')
    expect(md).toContain('  - 1\\. ordered\n')
    expect(md).toContain('  - trailing \\-\n')
    expect(md).toContain('  - mid-word C++ a+b\n')
    expect(md).toContain('  - a\\\\\\-\n')
    expect(md).toContain('- **Tools:** \\- · C+\\+')
  })
})
