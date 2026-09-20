import { For } from 'solid-js'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './Sidebar'

const stubItems = [
  { label: 'about (stub)', active: true },
  { label: 'projects (stub)', active: false },
  { label: 'contact (stub)', active: false },
]

export const AppSidebar = () => (
  <Sidebar>
    <SidebarHeader>
      <span class="text-foreground text-sm">Sidebar header (stub)</span>
    </SidebarHeader>
    <SidebarContent>
      <p class="text-muted-foreground px-2 text-xs">Sidebar content (stub)</p>
      <SidebarMenu>
        <For each={stubItems}>
          {(item) => (
            <SidebarMenuItem>
              <SidebarMenuButton active={item.active}>{item.label}</SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </For>
      </SidebarMenu>
    </SidebarContent>
    <SidebarFooter>Sidebar footer (stub)</SidebarFooter>
  </Sidebar>
)
