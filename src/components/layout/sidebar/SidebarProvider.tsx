import { createContext, createMemo, createSignal, onSettled, useContext } from 'solid-js'
import type { Accessor, ParentProps, Setter } from 'solid-js'

import { createMediaQuery } from '../../../lib/createMediaQuery'

const SIDEBAR_WIDTH = '16.75rem'

const MOBILE_QUERY = '(max-width: 1023px)'

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

  const isMobile = createMediaQuery(MOBILE_QUERY, (matches) => {
    if (!matches) setOpenMobile(false)
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
