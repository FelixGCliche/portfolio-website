import { ArrowRight } from '@lucide/solid'

import { ButtonLink, Card } from '@components'
import { useI18n } from '@features/i18n'
import { useProfile } from '@features/profile'
import { CopyButton, LinkCard, PanelHeader, SectionLabel } from '@features/response-blocks'

import { displayUrl } from './displayUrl'

// Email, GitHub and LinkedIn only: the phone number is deliberately left out
export const ContactResponse = () => {
  const { t } = useI18n()
  const profile = useProfile()

  const mailto = () =>
    `mailto:${profile().email}?subject=${encodeURIComponent(t('contact.subject'))}`

  return (
    <div class="flex flex-col gap-[22px]">
      <PanelHeader label={t('contact.header')} meta={`● ${profile().status}`} metaTone="success" />

      <Card variant="cta" class="gap-[18px] px-4 pt-[18px] pb-5 sm:px-6 sm:pt-6 sm:pb-[26px]">
        <h2 class="text-foreground sm:text-title text-[22px] leading-[1.2] font-bold tracking-[-.015em] text-pretty">
          {t('contact.title')}
        </h2>
        <p class="text-secondary-foreground max-w-[54ch] text-pretty">{t('contact.intro')}</p>
        <dl class="flex flex-col gap-0.5 text-[12.5px]">
          <div class="flex items-center gap-2.5">
            <dt class="text-muted-foreground w-16 flex-none">{t('contact.to')}</dt>
            <dd class="text-foreground flex min-w-0 flex-1 items-center gap-2.5">
              <span class="min-w-0 [overflow-wrap:anywhere]">{profile().email}</span>
              <span class="ml-auto flex-none">
                <CopyButton value={profile().email} ariaLabel={t('contact.copyEmail')} />
              </span>
            </dd>
          </div>
          <div class="flex gap-2.5">
            <dt class="text-muted-foreground w-16 flex-none">{t('contact.subjectLabel')}</dt>
            <dd class="text-foreground min-w-0">{t('contact.subject')}</dd>
          </div>
        </dl>
        <div class="flex flex-wrap items-center gap-x-[18px] gap-y-3">
          <ButtonLink href={mailto()} class="basis-full sm:basis-auto">
            <span>{t('contact.emailMe')}</span>
            <ArrowRight aria-hidden="true" size={16} />
          </ButtonLink>
        </div>
      </Card>

      <section class="flex flex-col gap-2.5">
        <SectionLabel>{t('contact.elsewhere')}</SectionLabel>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LinkCard label="github" value={displayUrl(profile().github)} href={profile().github} />
          <LinkCard
            label="linkedin"
            value={displayUrl(profile().linkedin)}
            href={profile().linkedin}
          />
        </div>
      </section>
    </div>
  )
}
