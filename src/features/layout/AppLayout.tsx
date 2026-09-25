import type { ParentProps } from 'solid-js'

import { SidebarInset, SidebarProvider } from '@components'
import { Composer } from '@features/composer'
import { PreferencesProvider } from '@features/preferences'
import { AppSidebar } from '@features/session-sidebar'

import { StatusBar } from './StatusBar'
import { Titlebar } from './Titlebar'

export const AppLayout = (props: ParentProps) => (
  <SidebarProvider>
    <PreferencesProvider>
      <div class="bg-background text-foreground pt-safe pr-safe pb-safe pl-safe relative h-dvh touch-manipulation overflow-hidden">
        <a
          href="#main"
          class="bg-primary text-primary-foreground border-border focus-visible:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:border focus:px-3 focus:text-sm focus:outline-none focus-visible:ring-2"
        >
          Skip to content
        </a>
        <div class="mx-auto h-full">
          <div class="border-border flex h-full min-h-0 flex-col md:border">
            <Titlebar />
            <div class="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
              <AppSidebar />
              <SidebarInset>
                <div
                  tabindex="0"
                  role="region"
                  aria-label="Content"
                  class="focus-visible:ring-ring min-h-0 flex-1 overflow-y-auto focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                >
                  {props.children}
                </div>
                <Composer />
              </SidebarInset>
            </div>
            <StatusBar />
          </div>
        </div>
      </div>
    </PreferencesProvider>
  </SidebarProvider>
)
