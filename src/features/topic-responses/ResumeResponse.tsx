import { For, Show } from 'solid-js'
import type { ParentProps } from 'solid-js'

import { ButtonLink, Card } from '@components'
import { useI18n } from '@features/i18n'
import { displayUrl, useProfile } from '@features/profile'
import { CopyButton, NextLink, PanelHeader } from '@features/response-blocks'

import { formatRange } from './duration'
import { buildResumeMarkdown } from './resumeMarkdown'
import { useEducation, useRoles, useSkills } from './useContent'

// Locale PDFs are optional (src/assets/resume/resume-<locale>.pdf) and picked up at build time
const RESUME_PDFS = import.meta.glob<string>('../../assets/resume/*.pdf', {
  eager: true,
  query: '?url',
  import: 'default',
})

const resumePdf = (locale: string): string | undefined =>
  RESUME_PDFS[`../../assets/resume/resume-${locale}.pdf`]

const ROW_CLASS =
  'border-border grid grid-cols-1 items-baseline gap-x-4 border-t px-5 first:border-t-0'

const Section = (props: ParentProps<{ label: string; meta: string }>) => (
  <section class="flex flex-col gap-3">
    <PanelHeader label={props.label} meta={props.meta} />
    {props.children}
  </section>
)

export const ResumeResponse = () => {
  const { t, locale } = useI18n()
  const profile = useProfile()
  const roles = useRoles()
  const education = useEducation()
  const skills = useSkills()

  // Built at click time, so the copy always matches the current locale
  const markdown = () =>
    buildResumeMarkdown({
      profile: {
        ...profile(),
        github: displayUrl(profile().github),
        linkedin: displayUrl(profile().linkedin),
      },
      summary: t('resume.profileBlurb'),
      roles: roles(),
      education: education(),
      skills: skills(),
      labels: {
        profile: t('resume.section.profile'),
        experience: t('resume.section.experience'),
        education: t('resume.section.education'),
        skills: t('resume.section.skills'),
        present: t('work.present'),
      },
    })

  return (
    <div class="flex flex-col gap-[22px]">
      <div class="flex flex-wrap items-center gap-x-[18px] gap-y-3">
        <Show when={resumePdf(locale())}>
          {(href) => (
            <ButtonLink href={href()} download class="basis-full sm:basis-auto">
              <span>{t('resume.download')}</span>
              <span aria-hidden="true">↓</span>
            </ButtonLink>
          )}
        </Show>
        <CopyButton value={markdown} label={t('resume.copyMarkdown')} />
        <span class="text-muted-foreground min-w-0 text-[12.5px]">
          {profile().name} · {profile().role}
        </span>
      </div>

      <Section label={t('resume.section.profile')} meta={t('resume.summary')}>
        <p class="text-secondary-foreground max-w-[62ch] text-pretty">{t('resume.profileBlurb')}</p>
      </Section>

      <Section label={t('resume.section.experience')} meta={t('work.newestFirst')}>
        <Card class="gap-0 py-0">
          <For each={roles()}>
            {(role) => (
              <div class={`${ROW_CLASS} py-3 sm:grid-cols-[minmax(0,1fr)_auto]`}>
                <span class="text-foreground min-w-0">
                  <span class="font-bold">{role.title}</span>{' '}
                  <span class="text-secondary-foreground">@ {role.company}</span>
                </span>
                <span class="text-label text-muted-foreground">
                  {formatRange(role.start, role.end, t('work.present'))}
                </span>
              </div>
            )}
          </For>
        </Card>
        <div class="-ml-2 self-start">
          <NextLink topic="/work">{t('resume.fullDetails', { command: '/work' })}</NextLink>
        </div>
      </Section>

      <Section
        label={t('resume.section.education')}
        meta={`${education().start} → ${education().end}`}
      >
        <Card class="gap-0.5 px-5 py-3.5">
          <span class="text-foreground font-bold">{education().degree}</span>
          <span class="text-secondary-foreground">{education().school}</span>
        </Card>
      </Section>

      <Section label={t('resume.section.skills')} meta={t('resume.byArea')}>
        <Card class="gap-0 py-0">
          <For each={skills()}>
            {(skill) => (
              <div
                class={`${ROW_CLASS} gap-y-0.5 py-2.5 sm:grid-cols-[minmax(84px,130px)_minmax(0,1fr)]`}
              >
                <span class="text-label text-muted-foreground uppercase">{skill.area}</span>
                <span class="text-foreground min-w-0">
                  <For each={skill.tools}>
                    {(tool, index) => (
                      <>
                        <span>{tool}</span>
                        <Show when={index() < skill.tools.length - 1}>
                          <span class="text-muted-foreground"> · </span>
                        </Show>
                      </>
                    )}
                  </For>
                </span>
              </div>
            )}
          </For>
        </Card>
      </Section>
    </div>
  )
}
