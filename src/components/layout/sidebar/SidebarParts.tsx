// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { omit } from 'solid-js'

import { useSidebar } from './SidebarProvider'

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
    <div
      {...rest}
      class={['flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 py-3', props.class]}
    >
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
    <ul {...rest} class={['flex w-full min-w-0 flex-col gap-0.5', props.class]}>
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
      class={[
        'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring data-[active=true]:border-primary data-[active=true]:bg-muted data-[active=true]:text-foreground flex w-full min-w-0 items-center gap-2 border-l-2 border-transparent px-2 py-2 text-left text-sm focus-visible:ring-2 focus-visible:outline-none lg:py-1.5',
        props.class,
      ]}
    >
      {props.children}
    </button>
  )
}

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
        'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-11 flex-none items-center justify-center focus-visible:ring-2 focus-visible:outline-none lg:size-8',
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
        class="size-5 lg:size-4"
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
      {...rest}
      class={['border-border flex min-h-0 min-w-0 flex-1 flex-col border-l', props.class]}
    >
      {props.children}
    </main>
  )
}
