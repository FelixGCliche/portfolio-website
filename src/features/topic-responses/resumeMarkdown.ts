import { formatRange } from './duration'

export type ResumeMarkdownInput = {
  profile: {
    name: string
    role: string
    location: string
    email: string
    github: string
    linkedin: string
  }
  summary: string
  roles: {
    title: string
    company: string
    start: string
    end: string | null
    bullets: string[]
  }[]
  education: { degree: string; school: string; start: number; end: number }
  skills: { area: string; tools: string[] }[]
  labels: {
    experience: string
    education: string
    skills: string
    present: string
    profile: string
  }
}

// Backslash-escapes characters that would otherwise be read as Markdown syntax
const escapeMarkdown = (text: string): string => text.replace(/[\\*_[\]`#<>]/g, '\\$&')

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

const heading = (label: string): string => `## ${capitalize(label)}`

export const buildResumeMarkdown = (input: ResumeMarkdownInput): string => {
  const { profile, summary, roles, education, skills, labels } = input
  const lines = [
    `# ${profile.name}`,
    '',
    `${profile.role} · ${profile.location}`,
    '',
    [profile.email, profile.github, profile.linkedin].join(' · '),
    '',
    heading(labels.profile),
    '',
    summary.trim(),
    '',
    heading(labels.experience),
    '',
    ...roles.flatMap((role) => [
      `- **${escapeMarkdown(role.title)}** @ ${escapeMarkdown(role.company)} (${formatRange(role.start, role.end, labels.present)})`,
      ...role.bullets.map((bullet) => `  - ${escapeMarkdown(bullet)}`),
    ]),
    '',
    heading(labels.education),
    '',
    `- **${escapeMarkdown(education.degree)}** @ ${escapeMarkdown(education.school)} (${formatRange(education.start, education.end, labels.present)})`,
    '',
    heading(labels.skills),
    '',
    ...skills.map(
      (skill) =>
        `- **${escapeMarkdown(skill.area)}:** ${skill.tools.map(escapeMarkdown).join(' · ')}`
    ),
  ]
  return `${lines.join('\n')}\n`
}
