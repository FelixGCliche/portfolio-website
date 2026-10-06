import { For, Show } from 'solid-js'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuLink,
  useSidebar,
} from '@components'
import { useConversation } from '@features/conversation'
import { useI18n } from '@features/i18n'
import { useProfile } from '@features/profile'
import { keyToParam, useTopics } from '@features/topics'

const linkClass =
  'text-primary focus-visible:ring-ring inline-flex min-h-11 items-center hover:underline focus-visible:ring-2 focus-visible:outline-none md:min-h-0'

export const AppSidebar = () => {
  const sidebar = useSidebar()
  const conversation = useConversation()
  const i18n = useI18n()
  const topics = useTopics()
  const profile = useProfile()

  const closeDrawer = () => {
    if (sidebar.isMobile()) sidebar.setOpenMobile(false)
  }

  return (
    <Sidebar label={i18n.t('sidebar.label')}>
      <SidebarHeader>
        <div class="flex items-center gap-2">
          <span
            aria-hidden="true"
            class="border-border bg-muted text-primary flex size-8 flex-none items-center justify-center border text-xs font-bold"
          >
            fg
          </span>
          <div class="flex min-w-0 flex-col">
            <span class="text-foreground text-sm font-bold">{profile().name}</span>
            <span class="text-muted-foreground text-xs">{profile().role}</span>
          </div>
          <Show when={sidebar.isMobile()}>
            <button
              type="button"
              aria-label={i18n.t('sidebar.close')}
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
        <nav aria-label={i18n.t('sidebar.topics')}>
          <p class="text-muted-foreground px-2 pb-2 text-[10.5px] tracking-[0.16em] uppercase">
            {i18n.t('sidebar.topics')}
          </p>
          <SidebarMenu>
            <For each={topics()} keyed={(topic) => topic.key}>
              {(topic) => (
                <SidebarMenuItem>
                  <SidebarMenuLink
                    to="/$locale/{-$topic}"
                    params={{ locale: i18n.locale(), topic: keyToParam(topic().key) }}
                    activeOptions={{ exact: true }}
                    onClick={(event: MouseEvent) => {
                      const plainClick =
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      if (plainClick) {
                        event.preventDefault()
                        conversation.run(topic().key)
                      }
                      closeDrawer()
                    }}
                    class="py-2.5"
                  >
                    <span class="flex min-w-0 flex-1 flex-col gap-1">
                      <span class="flex items-baseline gap-2">
                        <span class="text-primary truncate">{topic().key}</span>
                        <span class="text-muted-foreground ml-auto flex-none text-[10.5px]">
                          {topic().meta}
                        </span>
                      </span>
                      <span class="text-muted-foreground text-xs text-pretty">{topic().desc}</span>
                    </span>
                  </SidebarMenuLink>
                </SidebarMenuItem>
              )}
            </For>
          </SidebarMenu>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <p class="flex items-center gap-2">
          <span aria-hidden="true" class="bg-success size-1.5 flex-none" />
          <span class="text-success text-xs">{profile().status}</span>
        </p>
        <p class="flex items-baseline gap-2">
          <span class="text-muted-foreground">{i18n.t('sidebar.where')}</span>
          <span class="text-foreground ml-auto">{profile().location}</span>
        </p>
        <p class="flex items-baseline gap-2">
          <span class="text-muted-foreground">{i18n.t('sidebar.reply')}</span>
          <span class="text-foreground ml-auto">{i18n.t('sidebar.replyValue')}</span>
        </p>
        <p class="flex items-baseline gap-2">
          <span class="text-muted-foreground flex-none">{i18n.t('sidebar.email')}</span>
          <a href={`mailto:${profile().email}`} class={[linkClass, 'ml-auto break-all']}>
            {profile().email}
          </a>
        </p>
        <p class="flex items-baseline gap-2">
          <span class="text-muted-foreground flex-none">{i18n.t('sidebar.social')}</span>
          <a
            href={profile().github}
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
