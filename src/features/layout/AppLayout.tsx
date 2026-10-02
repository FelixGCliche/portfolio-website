import type { ParentProps } from 'solid-js'

import { SidebarInset, SidebarProvider } from '@components'
import { CommandPalette, CommandPaletteProvider } from '@features/command-palette'
import { ComposerProvider, Composer } from '@features/composer'
import { ConversationProvider } from '@features/conversation'
import { useI18n } from '@features/i18n'
import { PreferencesProvider } from '@features/preferences'
import { AppSidebar } from '@features/session-sidebar'

import { StatusBar } from './StatusBar'
import { Titlebar } from './Titlebar'

export const AppLayout = (props: ParentProps) => {
  const { t } = useI18n()

  return (
    <SidebarProvider>
      <PreferencesProvider>
        <ConversationProvider>
          <ComposerProvider>
            <CommandPaletteProvider>
              <div class="bg-background text-foreground pt-safe pr-safe pb-safe pl-safe relative h-dvh touch-manipulation overflow-hidden">
                <a
                  href="#main"
                  class="bg-primary text-primary-foreground border-border focus-visible:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:border focus:px-3 focus:text-sm focus:outline-none focus-visible:ring-2"
                >
                  {t('layout.skipToContent')}
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
                          aria-label={t('layout.contentLabel')}
                          data-scroller=""
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
              <CommandPalette />
            </CommandPaletteProvider>
          </ComposerProvider>
        </ConversationProvider>
      </PreferencesProvider>
    </SidebarProvider>
  )
}
