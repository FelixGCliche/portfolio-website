import { For } from 'solid-js'

import { Card } from '@components'
import { useI18n } from '@features/i18n'
import { NextLinks, PanelHeader, ToolRow } from '@features/response-blocks'

import { useSkills } from './useContent'

export const SkillsResponse = () => {
  const { t } = useI18n()
  const skills = useSkills()

  return (
    <div class="flex flex-col gap-5">
      <PanelHeader
        label={t('skills.header')}
        meta={t('skills.areas', { count: skills().length })}
      />
      <Card class="gap-0 py-0">
        <For each={skills()}>
          {(skill) => (
            <ToolRow
              area={skill.area}
              tools={skill.tools}
              count={t(skill.tools.length === 1 ? 'skills.tool' : 'skills.tools', {
                count: skill.tools.length,
              })}
            />
          )}
        </For>
      </Card>
      <NextLinks topics={['/work', '/projects', '/contact']} />
    </div>
  )
}
