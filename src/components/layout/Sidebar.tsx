// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  Match,
  omit,
  onSettled,
  Switch,
  useContext,
} from 'solid-js'
import type { Accessor, ParentProps, Setter } from 'solid-js'

import { useIsMobile } from '../../lib/useIsMobile'

const SIDEBAR_WIDTH = '16.75rem'

export type SheetProps = ParentProps<{
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  id?: string
  class?: ComponentProps<'div'>['class']
}>

export const Sheet = (props: SheetProps) => {
  let dialog!: HTMLDialogElement

  createEffect(
    () => props.open,
    (open) => {
      if (open) {
        if (!dialog.open) dialog.showModal()
      } else if (dialog.open) {
        dialog.close()
      }
    }
  )

  const handleClose = () => props.onOpenChange(false)

  const handleClick = (event: MouseEvent) => {
    if (event.target === dialog) props.onOpenChange(false)
  }

  return (
    <dialog
      ref={(el) => {
        dialog = el
      }}
      id={props.id}
      aria-label={props.label}
      onClose={handleClose}
      onClick={handleClick}
      class={[
        'bg-background text-foreground border-border backdrop:bg-background/60 m-0 mr-auto h-dvh max-h-none w-[min(84%,20rem)] max-w-none -translate-x-full border-r p-0 opacity-0 transition-[opacity,translate,overlay,display] transition-discrete duration-200 ease-out open:translate-x-0 open:opacity-100 motion-reduce:transition-none starting:open:-translate-x-full starting:open:opacity-0',
        props.class,
      ]}
    >
      <div class="pt-safe pb-safe flex h-full min-h-0 flex-col">{props.children}</div>
    </dialog>
  )
}

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

  onSettled(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'b' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

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
        'text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring data-[active=true]:border-primary data-[active=true]:bg-muted data-[active=true]:text-foreground flex w-full min-w-0 items-center gap-2 border-l-2 border-transparent px-4 py-2 text-left text-sm focus-visible:ring-2 focus-visible:outline-none lg:py-1.5',
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
