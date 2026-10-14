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
  roles: { title: string; company: string; start: string; end: string | null }[]
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

export const buildResumeMarkdown = (input: ResumeMarkdownInput): string => {
  const { profile, summary, roles, education, skills, labels } = input
  const lines = [
    `# ${profile.name}`,
    '',
    `${profile.role} · ${profile.location}`,
    '',
    [profile.email, profile.github, profile.linkedin].join(' · '),
    '',
    `## ${labels.profile}`,
    '',
    summary.trim(),
    '',
    `## ${labels.experience}`,
    '',
    ...roles.map(
      (role) =>
        `- **${role.title}** @ ${role.company} (${formatRange(role.start, role.end, labels.present)})`
    ),
    '',
    `## ${labels.education}`,
    '',
    `- **${education.degree}** @ ${education.school} (${education.start} → ${education.end})`,
    '',
    `## ${labels.skills}`,
    '',
    ...skills.map((skill) => `- **${skill.area}:** ${skill.tools.join(' · ')}`),
  ]
  return `${lines.join('\n')}\n`
}
