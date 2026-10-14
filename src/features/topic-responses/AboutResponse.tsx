import { Card } from '@components'
import { useI18n } from '@features/i18n'
import { Markdown } from '@features/markdown'
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
      <Markdown text={about().body} leadFirst />
      <NextLinks
        label={t('about.next', { location: profile().location })}
        topics={['/work', '/skills', '/contact']}
      />
    </div>
  )
}
