import type { Project } from '@content'
// eslint-disable-next-line solid/imports -- Portal lives in the renderer package in solid-js 2.x
import { Portal } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, For, onCleanup, Show } from 'solid-js'

import { Drawer, DrawerContent, useResponsePane } from '@components'
import { useI18n } from '@features/i18n'
import { CaseStudy, NextLinks, PanelHeader, Tag } from '@features/response-blocks'
import type { CaseStudyLink } from '@features/response-blocks'
import { videoWatchUrl } from '@features/safe-links'
import { useIsMobile } from '@hooks'

import { useProjects } from './useContent'

// One case study is open at a time across every mounted ProjectsResponse; each instance owns its slug
const [selection, setSelection] = createSignal<{ owner: string; slug: string } | null>(null, {
  name: 'projectSelection',
})

const ProjectCaseStudy = (props: { project: Project; onClose?: () => void }) => {
  const { t } = useI18n()

  const links = createMemo(
    (): CaseStudyLink[] => {
      const watch = props.project.video ? videoWatchUrl(props.project.video) : undefined
      return [
        ...(props.project.url ? [{ label: t('projects.play'), href: props.project.url }] : []),
        ...(watch ? [{ label: t('projects.watch'), href: watch }] : []),
      ]
    },
    { name: 'projectLinks' }
  )

  return (
    <CaseStudy
      eyebrow={t('projects.caseStudy')}
      name={props.project.name}
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
  const instanceId = createUniqueId()

  // The desktop panel overlays the response pane (between the hero and the composer, wrapping the scroller),
  // so it mounts there and stays put while the thread scrolls
  const responsePane = useResponsePane()

  const selected = () => {
    const current = selection()
    return current?.owner === instanceId ? current.slug : null
  }
  onCleanup(() => {
    if (selection()?.owner === instanceId) setSelection(null)
  })
  const selectedProject = createMemo(
    () => projects().find((project) => project.slug === selected()),
    { name: 'selectedProjectEntry' }
  )
  // Keeps the last case study in the sheet while it slides out after the selection clears
  const sheetProject = createMemo<Project | undefined>(
    (previous) => selectedProject() ?? previous,
    { name: 'sheetProject' }
  )

  // No label while nothing has been selected, rather than an empty-named dialog
  const sheetLabel = () => {
    const name = sheetProject()?.name
    return name ? t('projects.caseStudyOf', { name }) : undefined
  }

  const toggle = (slug: string) => {
    setSelection(selected() === slug ? null : { owner: instanceId, slug })
  }
  const close = () => {
    if (selection()?.owner === instanceId) setSelection(null)
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
      <Drawer
        direction="bottom"
        open={isMobile() && selectedProject() !== undefined}
        onOpenChange={(open) => {
          // The drawer also reports closing when the viewport grows past mobile; keep the selection then
          if (!open && isMobile()) close()
        }}
      >
        <DrawerContent id={sheetId} label={sheetLabel()} closeLabel={t('projects.close')}>
          <div class="flex flex-col gap-3.5 px-4 pb-7">
            <Show when={sheetProject()}>
              {(project) => <ProjectCaseStudy project={project()} />}
            </Show>
          </div>
        </DrawerContent>
      </Drawer>
      <Show when={responsePane()}>
        {(mount) => (
          <Portal mount={mount()}>
            <Drawer
              direction="right"
              modal={false}
              open={!isMobile() && selectedProject() !== undefined}
              onOpenChange={(open) => {
                // The panel also reports closing when the viewport shrinks to mobile; keep the selection then
                if (!open && !isMobile()) close()
              }}
            >
              <DrawerContent id={panelId} label={sheetLabel()}>
                <div class="bg-card min-h-0 flex-1 overflow-y-auto overscroll-contain p-[18px]">
                  <Show when={sheetProject()}>
                    {(project) => <ProjectCaseStudy project={project()} onClose={close} />}
                  </Show>
                </div>
              </DrawerContent>
            </Drawer>
          </Portal>
        )}
      </Show>
      <NextLinks topics={['/work', '/contact']} />
    </div>
  )
}
