import { createMemo, For, Show } from 'solid-js'

import { useComposer } from '@features/composer'
import { useConversation } from '@features/conversation'
import { useI18n } from '@features/i18n'
import type { UiKey } from '@features/i18n'
import { useProfile } from '@features/profile'
import { TOPIC_KEYS } from '@features/topics'
import type { TopicKey } from '@features/topics'

const CHIP_LABELS: Record<TopicKey, Extract<UiKey, `chips.${string}`>> = {
  '/about': 'chips.about',
  '/work': 'chips.work',
  '/skills': 'chips.skills',
  '/resume': 'chips.resume',
  '/contact': 'chips.contact',
}

const CHIP_CLASS =
  'border-border text-foreground hover:border-primary hover:text-primary hover:bg-muted focus-visible:ring-ring border px-[15px] py-2 text-[12.5px] whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none'

// Runs a topic from a chip and hands focus to the composer
const useRunTopic = () => {
  const conversation = useConversation()
  const composer = useComposer()
  return (key: TopicKey) => {
    conversation.run(key)
    composer.focus()
  }
}

const HeroChips = (props: { class: string; chipClass: string }) => {
  const { t } = useI18n()
  const runTopic = useRunTopic()

  return (
    <div role="group" aria-label={t('hero.chipsLabel')} class={props.class}>
      <For each={TOPIC_KEYS}>
        {(key) => (
          <button type="button" class={props.chipClass} onClick={() => runTopic(key)}>
            {t(CHIP_LABELS[key])}
          </button>
        )}
      </For>
    </div>
  )
}

const HeroFull = () => {
  const profile = useProfile()

  return (
    <div class="flex max-w-[640px] flex-col">
      <p class="text-primary text-[10.5px] leading-normal tracking-[.16em] uppercase md:text-[11.5px]">
        {profile().heroEyebrow}
      </p>
      <h1
        id="hero-title"
        class="text-foreground mt-[14px] text-[26px] leading-[1.16] font-bold tracking-[-.015em] text-pretty md:mt-[18px] md:text-[clamp(28px,4.2vw,44px)]"
      >
        {profile().heroTitle}
      </h1>
      <div class="bg-primary mt-[18px] h-0.5 w-11 md:mt-6 md:w-[54px]" aria-hidden="true" />
      <p class="text-secondary-foreground mt-[22px] hidden max-w-[52ch] text-sm leading-[1.8] text-pretty md:block">
        {profile().heroLede}
      </p>
      <HeroChips
        class="mt-5 flex flex-wrap gap-2 md:mt-[26px] md:gap-[9px]"
        chipClass={CHIP_CLASS}
      />
    </div>
  )
}

export const Hero = () => {
  const conversation = useConversation()
  const collapsed = createMemo(() => conversation.state.messages.length > 0, {
    name: 'heroCollapsed',
  })

  return (
    <Show when={!collapsed()}>
      <section
        aria-labelledby="hero-title"
        class="border-border border-b px-[18px] pt-6 pb-[22px] md:px-[38px] md:pt-[34px] md:pb-8"
      >
        <HeroFull />
      </section>
    </Show>
  )
}
