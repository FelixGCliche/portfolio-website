// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { Match, Switch } from 'solid-js'
import type { ParentProps } from 'solid-js'

import { Sheet } from './Sheet'
import { useSidebar } from './SidebarProvider'

export type SidebarProps = ParentProps<{ class?: ComponentProps<'div'>['class'] }>

export const Sidebar = (props: SidebarProps) => {
  const sidebar = useSidebar()

  return (
    <Switch>
      <Match when={sidebar.isMobile()}>
        <Sheet
          id="sidebar"
          label="Sidebar"
          open={sidebar.openMobile()}
          onOpenChange={sidebar.setOpenMobile}
          class={props.class}
        >
          {props.children}
        </Sheet>
      </Match>
      <Match when={!sidebar.isMobile()}>
        <div class="group hidden h-full lg:block" data-state={sidebar.state()}>
          <div class="h-full w-(--sidebar-width) transition-[width] duration-200 ease-linear group-data-[state=collapsed]:w-0 motion-reduce:transition-none" />
          <aside
            id="sidebar"
            aria-label="Sidebar"
            inert={sidebar.state() === 'collapsed'}
            class={[
              'bg-background border-border absolute inset-y-0 left-0 z-10 flex w-(--sidebar-width) flex-col border-r transition-transform duration-200 ease-linear group-data-[state=collapsed]:-translate-x-full motion-reduce:transition-none',
              props.class,
            ]}
          >
            {props.children}
          </aside>
        </div>
      </Match>
    </Switch>
  )
}
