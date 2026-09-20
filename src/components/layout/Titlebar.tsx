import { SidebarTrigger } from './Sidebar'

export const Titlebar = () => (
  <header class="bg-card border-border flex h-14 flex-none items-center gap-2 border-b px-1 lg:h-10 lg:px-2">
    <SidebarTrigger />
    <span class="text-muted-foreground truncate text-sm">Titlebar (stub)</span>
  </header>
)
