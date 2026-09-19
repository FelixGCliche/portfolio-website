import type { ParentProps } from 'solid-js'

import { AppSidebar } from './AppSidebar'
import { PromptDock } from './PromptDock'
import { SidebarInset, SidebarProvider } from './sidebar'
import { StatusBar } from './StatusBar'
import { Titlebar } from './Titlebar'

export const AppShell = (props: ParentProps) => (
  <SidebarProvider>
    <div class="bg-background text-foreground pt-safe pr-safe pb-safe pl-safe h-dvh overflow-hidden">
      <div class="mx-auto flex h-full min-h-0 flex-col">
        <Titlebar />
        <div class="border-border relative flex min-h-0 min-w-0 flex-1 overflow-hidden border">
          <AppSidebar />
          <SidebarInset>
            <div class="min-h-0 flex-1 overflow-y-auto">{props.children}</div>
            <PromptDock />
          </SidebarInset>
        </div>
        <StatusBar />
      </div>
    </div>
  </SidebarProvider>
)
