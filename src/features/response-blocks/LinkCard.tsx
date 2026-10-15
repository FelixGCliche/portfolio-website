import { ArrowUpRight } from '@lucide/solid'
import { Show } from 'solid-js'

import { useI18n } from '@features/i18n'

export type LinkCardProps = {
  label: string
  value: string
  href: string
}

// Web links open in a new tab; mailto:, tel: and in-site links stay in place
export const opensNewTab = (href: string) => /^https?:\/\//i.test(href)

export const LinkCard = (props: LinkCardProps) => {
  const { t } = useI18n()
  const newTab = () => opensNewTab(props.href)

  return (
    <a
      href={props.href}
      target={newTab() ? '_blank' : undefined}
      rel={newTab() ? 'noopener noreferrer' : undefined}
      class="focus-ring border-border text-foreground hover:border-primary flex min-h-[52px] items-center justify-between gap-3 border px-[18px] transition-[border-color] motion-reduce:transition-none"
    >
      <span class="flex min-w-0 flex-col leading-[1.35]">
        <span class="text-label text-muted-foreground">{props.label}</span>
        <span class="font-medium break-words">
          {props.value}
          <Show when={newTab()}>
            <span class="sr-only"> {t('blocks.opensNewTab')}</span>
          </Show>
        </span>
      </span>
      <Show when={newTab()}>
        <ArrowUpRight aria-hidden="true" size={16} class="text-primary flex-none" />
      </Show>
    </a>
  )
}
