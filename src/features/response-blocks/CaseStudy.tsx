import { X } from '@lucide/solid'
import { createMemo, For, Show } from 'solid-js'

import { useI18n } from '@features/i18n'
import { classifyHref } from '@features/safe-links'

import { Tag } from './Tag'

export type CaseStudyLink = {
  // Visible text, e.g. 'play'; an arrow is appended
  label: string
  href: string
}

export type CaseStudyProps = {
  eyebrow: string
  name: string
  stack: string[]
  description: string
  heading: string
  paragraphs: string[]
  // Only links that pass the safe-links check are rendered; each opens in a new tab
  links?: CaseStudyLink[]
  // When set, a close button sits next to the name
  onClose?: () => void
  closeLabel?: string
  // Id for the name, so a container can point aria-labelledby at it
  nameId?: string
}

// One project told as a short case study: name, stack, summary, how it was built, and its links
export const CaseStudy = (props: CaseStudyProps) => {
  const { t } = useI18n()
  const links = createMemo(
    () => (props.links ?? []).filter((link) => classifyHref(link.href)?.kind === 'external'),
    { name: 'caseStudyLinks' }
  )

  return (
    <div class="flex flex-col gap-3.5">
      <div class="flex items-start gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-label text-muted-foreground">{props.eyebrow}</p>
          <h3
            id={props.nameId}
            class="text-primary text-[16px] leading-normal font-bold [overflow-wrap:anywhere]"
          >
            {props.name}
          </h3>
        </div>
        <Show when={props.onClose}>
          {(onClose) => (
            <button
              type="button"
              aria-label={props.closeLabel}
              onClick={() => onClose()()}
              class="focus-ring text-muted-foreground hover:text-foreground -mt-2.5 -mr-2.5 inline-flex min-h-11 min-w-11 flex-none items-center justify-center"
            >
              <X aria-hidden="true" size={16} />
            </button>
          )}
        </Show>
      </div>
      <ul class="flex flex-wrap gap-1.5">
        <For each={props.stack}>
          {(tool) => (
            <li>
              <Tag>{tool}</Tag>
            </li>
          )}
        </For>
      </ul>
      <p class="text-secondary-foreground text-pretty">{props.description}</p>
      <h4 class="text-foreground font-bold">{props.heading}</h4>
      <div class="text-secondary-foreground flex flex-col gap-2.5">
        <For each={props.paragraphs}>{(paragraph) => <p class="text-pretty">{paragraph}</p>}</For>
      </div>
      <Show when={links().length > 0}>
        <div class="-mx-2 -mb-2 flex flex-wrap gap-x-1.5">
          <For each={links()}>
            {(link) => (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                class="focus-ring text-primary inline-flex min-h-11 items-center px-2 underline underline-offset-4 hover:opacity-80"
              >
                {link.label}
                <span aria-hidden="true">&nbsp;↗</span>
                <span class="sr-only"> {t('blocks.opensNewTab')}</span>
              </a>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
