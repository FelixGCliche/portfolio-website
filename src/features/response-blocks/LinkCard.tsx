import { Show } from 'solid-js'

import { useI18n } from '@features/i18n'

export type LinkCardProps = {
  label: string
  value: string
  href: string
}

// Web links open in a new tab; mailto:, tel: and in-site links stay in place
const opensNewTab = (href: string) => /^https?:\/\//i.test(href)

export const LinkCard = (props: LinkCardProps) => {
  const { t } = useI18n()

  return (
    <a
      href={props.href}
      target={opensNewTab(props.href) ? '_blank' : undefined}
      rel={opensNewTab(props.href) ? 'noopener noreferrer' : undefined}
      class="focus-ring border-border text-foreground hover:border-primary flex min-h-[52px] items-center justify-between gap-3 border px-[18px] transition-[border-color] motion-reduce:transition-none"
    >
      <span class="flex min-w-0 flex-col leading-[1.35]">
        <span class="text-label text-muted-foreground">{props.label}</span>
        <span class="font-medium break-words">{props.value}</span>
      </span>
      <span class="text-primary flex-none" aria-hidden="true">
        ↗
      </span>
      <Show when={opensNewTab(props.href)}>
        <span class="sr-only">{t('blocks.opensNewTab')}</span>
      </Show>
    </a>
  )
}
