import { formatForDisplay } from '@tanstack/hotkeys'
import { Show } from 'solid-js'

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
          class="text-muted-foreground hover:text-primary hover:bg-muted focus-visible:ring-ring inline-flex min-w-11 items-center justify-center px-3 text-[11.5px] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset md:min-w-0"
        >
          <span class="sr-only">Switch language</span>
          <span class="uppercase xl:hidden">{preferences.lang()}</span>
          <span class="hidden whitespace-nowrap xl:inline">
            <span class={preferences.lang() === 'en' ? 'text-foreground' : undefined}>EN</span>
            {' · '}
            <span class={preferences.lang() === 'fr' ? 'text-foreground' : undefined}>FR</span>
          </span>
        </button>

        <button
          type="button"
          onClick={preferences.toggleTheme}
          aria-pressed={preferences.theme() === 'dark' ? 'true' : 'false'}
          class="text-muted-foreground hover:text-primary hover:bg-muted focus-visible:ring-ring inline-flex min-w-11 items-center justify-center px-3 text-[11.5px] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset md:min-w-0"
        >
          <span class="sr-only">Toggle theme</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="square"
            class="size-5 md:size-4"
          >
            <Show
              when={preferences.theme() === 'dark'}
              fallback={
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
                </>
              }
            >
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
            </Show>
          </svg>
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
