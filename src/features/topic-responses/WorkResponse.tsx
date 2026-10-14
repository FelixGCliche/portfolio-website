import { For } from 'solid-js'

import { useI18n } from '@features/i18n'
import {
  BulletList,
  DurationBar,
  NextLinks,
  PanelHeader,
  Tag,
  Timeline,
  TimelineItem,
} from '@features/response-blocks'

import { formatRange, monthsBetween } from './duration'
import { useRoles } from './useContent'

export const WorkResponse = () => {
  const { t } = useI18n()
  const roles = useRoles()

  return (
    <div class="flex flex-col gap-5">
      <PanelHeader label={t('work.header')} meta={t('work.newestFirst')} />
      <Timeline>
        <For each={roles()}>
          {(role, index) => (
            <TimelineItem
              title={role.title}
              company={role.company}
              range={formatRange(role.start, role.end, t('work.present'))}
              current={role.end === null}
              last={index() === roles().length - 1}
            >
              <div class="flex items-center gap-2.5">
                <Tag>{t('work.months', { count: monthsBetween(role.start, role.end) })}</Tag>
                <DurationBar months={monthsBetween(role.start, role.end)} />
              </div>
              <div class="text-secondary-foreground">
                <BulletList items={role.bullets} />
              </div>
            </TimelineItem>
          )}
        </For>
      </Timeline>
      <NextLinks topics={['/skills', '/resume']} />
    </div>
  )
}
