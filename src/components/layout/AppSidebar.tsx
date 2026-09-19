import { createSignal, For, Show } from 'solid-js'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './Sidebar'

type Session = {
  key: string
  meta: string
  desc: string
}

const sessions: Session[] = [
  { key: '/about', meta: '5y', desc: 'How I got here, briefly' },
  { key: '/work', meta: '4 roles', desc: 'What I shipped, and where' },
  { key: '/skills', meta: '6 areas', desc: 'The toolbox, honestly rated' },
  { key: '/resume', meta: 'pdf', desc: 'The full CV, downloadable' },
  { key: '/contact', meta: 'open', desc: 'Same-day answer, promised' },
]

const linkClass =
  'text-primary focus-visible:ring-ring inline-flex min-h-11 items-center hover:underline focus-visible:ring-2 focus-visible:outline-none lg:min-h-0'

export const AppSidebar = () => {
  const sidebar = useSidebar()
  const [activeSession, setActiveSession] = createSignal('/about', { name: 'activeSession' })

  const selectSession = (key: string) => {
    setActiveSession(key)
    if (sidebar.isMobile()) sidebar.setOpenMobile(false)
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div class="flex items-center gap-2">
          <span
            aria-hidden="true"
            class="border-border bg-muted text-primary flex size-8 flex-none items-center justify-center border text-xs font-bold"
          >
            fg
          </span>
          <div class="flex min-w-0 flex-col">
            <span class="text-foreground text-sm font-bold">Félix Gagné Cliche</span>
            <span class="text-muted-foreground text-xs">Software developer</span>
          </div>
          <Show when={sidebar.isMobile()}>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => sidebar.setOpenMobile(false)}
              class="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring ml-auto inline-flex size-11 flex-none items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="square"
                class="size-5"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </Show>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Sessions">
          <p class="text-muted-foreground px-2 pb-2 text-[10.5px] tracking-[0.16em] uppercase">
            sessions
          </p>
          <SidebarMenu>
            <For each={sessions}>
              {(session) => (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    active={activeSession() === session.key}
                    aria-current={activeSession() === session.key ? 'page' : undefined}
                    onClick={() => selectSession(session.key)}
                    class="py-2.5"
                  >
                    <span class="flex min-w-0 flex-1 flex-col gap-1">
                      <span class="flex items-baseline gap-2">
                        <span class="text-primary truncate">{session.key}</span>
                        <span class="text-muted-foreground ml-auto flex-none text-[10.5px]">
                          {session.meta}
                        </span>
                      </span>
                      <span class="text-muted-foreground/70 text-xs text-pretty">
                        {session.desc}
                      </span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </For>
          </SidebarMenu>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <p class="flex items-center gap-2">
          <span aria-hidden="true" class="bg-success size-1.5 flex-none" />
          <span class="text-success text-xs">available for work</span>
        </p>
        <p class="flex items-baseline gap-2">
          <span class="text-muted-foreground">where</span>
          <span class="text-foreground ml-auto">Québec, QC</span>
        </p>
        <p class="flex items-baseline gap-2">
          <span class="text-muted-foreground">reply</span>
          <span class="text-foreground ml-auto">same day</span>
        </p>
        <p class="flex items-baseline gap-2">
          <span class="text-muted-foreground flex-none">email</span>
          <a href="mailto:felix@gagnecliche.dev" class={[linkClass, 'ml-auto break-all']}>
            felix@gagnecliche.dev
          </a>
        </p>
        <p class="flex items-baseline gap-2">
          <span class="text-muted-foreground flex-none">social</span>
          <a
            href="https://github.com/FelixGCliche"
            target="_blank"
            rel="noreferrer"
            class={[linkClass, 'ml-auto']}
          >
            github
          </a>
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
