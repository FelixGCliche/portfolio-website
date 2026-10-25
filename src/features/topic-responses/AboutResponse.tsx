import { Card } from '@components'
import { useI18n } from '@features/i18n'
import { useProfile } from '@features/profile'
import { KeyValue, NextLinks, PanelHeader } from '@features/response-blocks'

import { useAbout } from './useContent'

export const AboutResponse = () => {
  const { t } = useI18n()
  const profile = useProfile()
  const about = useAbout()

  return (
    <div class="flex flex-col gap-5">
      <PanelHeader label={t('about.header')} meta={t('about.meta')} />
      <Card class="px-[22px] py-[18px] sm:px-[22px]">
        <KeyValue
          rows={[
            { key: t('about.name'), value: profile().name },
            { key: t('about.role'), value: profile().role },
            { key: t('about.location'), value: profile().location },
            { key: t('about.status'), value: `● ${profile().status}`, tone: 'success' },
          ]}
        />
      </Card>
      <div
        class="text-secondary-foreground [&>p:first-child]:text-lead [&_strong]:text-foreground flex max-w-[62ch] flex-col gap-3.5 [&_strong]:font-bold [&>p]:text-pretty"
        // oxlint-disable-next-line solid/no-innerhtml -- compiled from the content file at build time by velite, no user input
        innerHTML={about().body}
      />
      <NextLinks
        label={t('about.next', { location: profile().location })}
        topics={['/work', '/skills', '/contact']}
      />
    </div>
  )
}
