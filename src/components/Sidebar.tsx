// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { createLink } from '@tanstack/solid-router'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  Match,
  omit,
  Switch,
  useContext,
} from 'solid-js'
import type { Accessor, ParentProps, Setter } from 'solid-js'

import { useHotkey, useIsMobile } from '@hooks'

import { Sheet } from './Sheet'

const SIDEBAR_WIDTH = '18rem'

export type SidebarState = 'expanded' | 'collapsed'

export type SidebarContextValue = {
  state: Accessor<SidebarState>
  open: Accessor<boolean>
  setOpen: Setter<boolean>
  isMobile: Accessor<boolean>
  openMobile: Accessor<boolean>
  setOpenMobile: Setter<boolean>
  toggleSidebar: () => void
}

export const SidebarContext = createContext<SidebarContextValue>()

export const useSidebar = () => useContext(SidebarContext)

export const SidebarProvider = (props: ParentProps) => {
  const [open, setOpen] = createSignal(true, { name: 'sidebarOpen' })
  const [openMobile, setOpenMobile] = createSignal(false, { name: 'sidebarOpenMobile' })

  const isMobile = useIsMobile()

  createEffect(isMobile, (mobile) => {
    if (!mobile) setOpenMobile(false)
  })

  const state = createMemo<SidebarState>(() => (open() ? 'expanded' : 'collapsed'), {
    name: 'sidebarState',
  })

  const toggleSidebar = () => {
    if (isMobile()) setOpenMobile((value) => !value)
    else setOpen((value) => !value)
  }

  useHotkey('mod+b', toggleSidebar)

  const value: SidebarContextValue = {
    state,
    open,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
  }

  return (
    <SidebarContext value={value}>
      <div class="h-full" style={{ '--sidebar-width': SIDEBAR_WIDTH }}>
        {props.children}
      </div>
    </SidebarContext>
  )
}

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
        <div class="group hidden h-full md:block" data-state={sidebar.state()}>
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

export const SidebarHeader = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class', 'children')

  return (
    <div
      {...rest}
      class={['border-border flex flex-none flex-col gap-1 border-b px-3 py-2', props.class]}
    >
      {props.children}
    </div>
  )
}

export const SidebarContent = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class', 'children')

  return (
    <div {...rest} class={['flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-3', props.class]}>
      {props.children}
    </div>
  )
}

export const SidebarFooter = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class', 'children')

  return (
    <div
      {...rest}
      class={[
        'border-border text-muted-foreground flex flex-none flex-col gap-1 border-t px-3 py-2 text-xs',
        props.class,
      ]}
    >
      {props.children}
    </div>
  )
}

export const SidebarMenu = (props: ComponentProps<'ul'>) => {
  const rest = omit(props, 'class', 'children')

  return (
    <ul {...rest} class={['flex w-full min-w-0 flex-col', props.class]}>
      {props.children}
    </ul>
  )
}

export const SidebarMenuItem = (props: ComponentProps<'li'>) => {
  const rest = omit(props, 'class', 'children')

  return (
    <li {...rest} class={['group/menu-item relative', props.class]}>
      {props.children}
    </li>
  )
}

const menuRowClass =
  'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring data-[active=true]:border-primary data-[active=true]:bg-muted data-[active=true]:text-foreground flex w-full min-w-0 items-center gap-2 border-l-2 border-transparent px-4 py-2 text-left text-sm focus-visible:ring-2 focus-visible:outline-none md:py-1.5'

export type SidebarMenuButtonProps = ComponentProps<'button'> & {
  active?: boolean
}

export const SidebarMenuButton = (props: SidebarMenuButtonProps) => {
  const rest = omit(props, 'class', 'children', 'active')

  return (
    <button
      type="button"
      {...rest}
      data-active={props.active ? 'true' : 'false'}
      class={[menuRowClass, props.class]}
    >
      {props.children}
    </button>
  )
}

const SidebarMenuAnchor = (props: ComponentProps<'a'> & { 'data-status'?: string }) => {
  const rest = omit(props, 'class', 'children')

  return (
    <a
      {...rest}
      data-active={props['data-status'] === 'active' ? 'true' : 'false'}
      class={[menuRowClass, props.class]}
    >
      {props.children}
    </a>
  )
}

export const SidebarMenuLink = createLink(SidebarMenuAnchor)

export type SidebarTriggerProps = ComponentProps<'button'>

export const SidebarTrigger = (props: SidebarTriggerProps) => {
  const sidebar = useSidebar()
  const rest = omit(props, 'class', 'children', 'onClick')

  const expanded = () =>
    sidebar.isMobile() ? sidebar.openMobile() : sidebar.state() === 'expanded'

  return (
    <button
      type="button"
      {...rest}
      aria-controls="sidebar"
      aria-expanded={expanded() ? 'true' : 'false'}
      onClick={() => sidebar.toggleSidebar()}
      class={[
        'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-11 flex-none items-center justify-center focus-visible:ring-2 focus-visible:outline-none md:size-8',
        props.class,
      ]}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="square"
        class="size-5 md:size-4"
      >
        <path d="M3.5 5.5h17M3.5 12h17M3.5 18.5h17" />
      </svg>
      <span class="sr-only">Toggle sidebar</span>
    </button>
  )
}

export const SidebarInset = (props: ComponentProps<'main'>) => {
  const rest = omit(props, 'class', 'children')

  return (
    <main
      id="main"
      tabindex="-1"
      {...rest}
      class={['flex min-h-0 min-w-0 flex-1 flex-col focus:outline-none', props.class]}
    >
      {props.children}
    </main>
  )
}
