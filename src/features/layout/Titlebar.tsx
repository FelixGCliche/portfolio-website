import { SidebarTrigger } from '@components'

export const Titlebar = () => (
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
        class="text-muted-foreground hover:text-primary hover:bg-muted focus-visible:ring-ring inline-flex min-w-11 items-center justify-center px-3 text-[11.5px] focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset md:min-w-0"
      >
        <span class="sr-only">Switch language</span>
        <span class="xl:hidden">EN</span>
        <span class="hidden whitespace-nowrap xl:inline">EN · FR</span>
      </button>

      <button
        type="button"
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
        <span class="hidden md:inline">⌘K</span>
      </button>
    </div>
  </header>
)
