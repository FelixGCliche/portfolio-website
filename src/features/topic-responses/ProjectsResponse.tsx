import type { Project } from '@content'
// eslint-disable-next-line solid/imports -- Portal lives in the renderer package in solid-js 2.x
import { Portal } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, For, Show } from 'solid-js'

import { Sheet, useResponsePane } from '@components'
import { useI18n } from '@features/i18n'
import { CaseStudy, NextLinks, PanelHeader, Tag } from '@features/response-blocks'
import type { CaseStudyLink } from '@features/response-blocks'
import { videoWatchUrl } from '@features/safe-links'
import { useIsMobile } from '@hooks'

import { useProjects } from './useContent'

const ProjectCaseStudy = (props: { project: Project; nameId: string; onClose?: () => void }) => {
  const { t } = useI18n()

  const links = (): CaseStudyLink[] => {
    const watch = props.project.video ? videoWatchUrl(props.project.video) : undefined
    return [
      ...(props.project.url ? [{ label: t('projects.play'), href: props.project.url }] : []),
      ...(watch ? [{ label: t('projects.watch'), href: watch }] : []),
    ]
  }

  return (
    <CaseStudy
      eyebrow={t('projects.caseStudy')}
      name={props.project.name}
      nameId={props.nameId}
      stack={props.project.stack}
      description={props.project.description}
      heading={t('projects.builtHeading')}
      paragraphs={props.project.built}
      links={links()}
      onClose={props.onClose}
      closeLabel={t('projects.close')}
    />
  )
}

export const ProjectsResponse = () => {
  const { t } = useI18n()
  const projects = useProjects()
  const isMobile = useIsMobile()
  const panelId = createUniqueId()
  const sheetId = createUniqueId()
  const panelNameId = createUniqueId()
  const sheetNameId = createUniqueId()

  // The desktop panel overlays the response pane (between the hero and the composer, wrapping the scroller),
  // so it mounts there and stays put while the thread scrolls
  const responsePane = useResponsePane()

  const [selected, setSelected] = createSignal<string | null>(null, { name: 'selectedProject' })
  const selectedProject = createMemo(
    () => projects().find((project) => project.slug === selected()),
    { name: 'selectedProjectEntry' }
  )
  // Keeps the last case study in the sheet while it slides out after the selection clears
  const sheetProject = createMemo<Project | undefined>(
    (previous) => selectedProject() ?? previous,
    { name: 'sheetProject' }
  )

  const toggle = (slug: string) => {
    setSelected((current) => (current === slug ? null : slug))
  }
  const close = () => {
    setSelected(null)
  }

  return (
    <div class="flex flex-col gap-5">
      <PanelHeader
        label={t('projects.header')}
        meta={t('projects.count', { count: projects().length })}
      />
      <ul class="border-border border-t">
        <For each={projects()}>
          {(project) => {
            const active = () => selected() === project.slug
            return (
              <li class={['border-border border-b', { 'bg-card': active() }]}>
                <button
                  type="button"
                  aria-expanded={active() ? 'true' : 'false'}
                  aria-controls={active() ? (isMobile() ? sheetId : panelId) : undefined}
                  onClick={() => toggle(project.slug)}
                  class="focus-ring grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3.5 px-3 py-2.5 text-left [outline-offset:-2px] md:px-4 md:py-2"
                >
                  <span class="flex min-w-0 flex-col gap-1.5">
                    <span
                      class={[
                        'font-bold [overflow-wrap:anywhere]',
                        active() ? 'text-primary' : 'text-foreground',
                      ]}
                    >
                      <span aria-hidden="true" class="text-muted-foreground mr-2 font-normal">
                        ▸
                      </span>
                      {project.name}
                    </span>
                    <span class="flex flex-wrap gap-1.5">
                      <For each={project.stack}>{(tool) => <Tag>{tool}</Tag>}</For>
                    </span>
                  </span>
                  <span class="text-label text-muted-foreground justify-self-end tracking-normal whitespace-nowrap">
                    {project.year}
                  </span>
                </button>
              </li>
            )
          }}
        </For>
      </ul>
      <Sheet
        side="bottom"
        draggable
        id={sheetId}
        open={isMobile() && selectedProject() !== undefined}
        onOpenChange={(open) => {
          // The sheet also reports closing when the viewport grows past mobile; keep the selection then
          if (!open && isMobile()) close()
        }}
        label={t('projects.caseStudyOf', { name: sheetProject()?.name ?? '' })}
        closeLabel={t('projects.close')}
      >
        <Show when={sheetProject()}>
          {(project) => <ProjectCaseStudy project={project()} nameId={sheetNameId} />}
        </Show>
      </Sheet>
      <Show when={responsePane()}>
        {(mount) => (
          <Portal mount={mount()}>
            <Sheet
              side="right"
              modal={false}
              id={panelId}
              open={!isMobile() && selectedProject() !== undefined}
              onOpenChange={(open) => {
                // The panel also reports closing when the viewport shrinks to mobile; keep the selection then
                if (!open && !isMobile()) close()
              }}
              label={t('projects.caseStudyOf', { name: sheetProject()?.name ?? '' })}
            >
              <div class="bg-card min-h-0 flex-1 overflow-y-auto overscroll-contain p-[18px]">
                <Show when={sheetProject()}>
                  {(project) => (
                    <ProjectCaseStudy project={project()} nameId={panelNameId} onClose={close} />
                  )}
                </Show>
              </div>
            </Sheet>
          </Portal>
        )}
      </Show>
      <NextLinks topics={['/work', '/contact']} />
    </div>
  )
}
