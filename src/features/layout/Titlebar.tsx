import { formatForDisplay } from '@tanstack/hotkeys'

import { SidebarTrigger } from '@components'
import { useCommandPalette } from '@features/command-palette'
import { usePreferences } from '@features/preferences'

export const Titlebar = () => {
  // Client-only app: the platform is known at render time
  const paletteLabel = formatForDisplay('Mod+K')
  const preferences = usePreferences()
  const palette = useCommandPalette()

  return (
    <header class="bg-card border-border flex h-14 flex-none items-stretch border-b md:h-10">
      <div class="border-border flex flex-none items-center border-r">
        <SidebarTrigger />
      </div>

      <div class="text-primary border-border flex flex-none items-center px-3 text-[13px] font-bold md:border-r">
        [fgc]
      </div>

      <div class="flex min-w-0 flex-1 items-center gap-2.5 px-2 md:px-3.5">
        <span class="text-muted-foreground md:text-foreground truncate text-[11.5px] tracking-[0.06em]">
          felix@portfolio
        </span>
        <span class="text-muted-foreground hidden text-[11px] whitespace-nowrap md:inline">
          ~/console — software developer
        </span>
      </div>

      <div class="border-border flex flex-none items-stretch border-l">
        <button
          type="button"
          onClick={preferences.toggleLang}
          class="text-muted-foreground hover:text-primary hover:bg-muted focus-visible:ring-ring inline-flex min-w-11 items-center justify-center px-3 text-[11.5px] uppercase focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset md:min-w-0"
        >
          <span class="sr-only">Switch language</span>
          {/* Driven by <html lang> (set before first paint by the init script), not the signal */}
          <span class="[html[lang=fr]_&]:hidden">EN</span>
          <span class="hidden [html[lang=fr]_&]:inline">FR</span>
        </button>

        <button
          type="button"
          onClick={() => palette.setOpen(true)}
          aria-haspopup="dialog"
          aria-controls="commandPalette"
          aria-expanded={palette.open() ? 'true' : 'false'}
          aria-keyshortcuts="Control+K Meta+K"
          class="text-muted-foreground hover:text-primary hover:bg-muted focus-visible:ring-ring inline-flex min-w-11 items-center justify-center px-3 text-[11.5px] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset md:min-w-0"
        >
          <span class="sr-only">Open command palette</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="square"
            class="size-5 md:hidden"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <span aria-hidden="true" class="hidden whitespace-nowrap md:inline">
            {paletteLabel}
          </span>
        </button>
      </div>
    </header>
  )
}
