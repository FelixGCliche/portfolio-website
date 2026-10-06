import { createSignal, createUniqueId, For, onSettled } from 'solid-js'

import { useComposer } from '@features/composer'
import { useConversation } from '@features/conversation'
import { useI18n } from '@features/i18n'
import type { UiKey } from '@features/i18n'
import { useProfile } from '@features/profile'
import { TOPIC_KEYS } from '@features/topics'
import type { TopicKey } from '@features/topics'
import { useIsMobile } from '@hooks'

const CHIP_LABELS: Record<TopicKey, Extract<UiKey, `chips.${string}`>> = {
  '/about': 'chips.about',
  '/work': 'chips.work',
  '/skills': 'chips.skills',
  '/resume': 'chips.resume',
  '/contact': 'chips.contact',
}

const CHIP_CLASS =
  'border-border text-foreground hover:border-primary hover:text-primary hover:bg-muted focus-visible:ring-ring border px-[15px] py-2 text-[12.5px] whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none'

// Transitions only apply once data-animate is set, so the first paint (and a deep link's collapse) snaps
const VARIANT_CLASS =
  'grid ease-out duration-200 motion-reduce:transition-none motion-safe:group-data-[animate]/hero:transition-[grid-template-rows,opacity]'

const SLIM_CHIP_CLASS =
  'border-border text-muted-foreground hover:border-primary hover:text-primary focus-visible:ring-ring border px-[10px] py-1 text-[11.5px] whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none md:px-[11px]'

// Runs a topic from a chip and hands focus to the composer (skipped on mobile to avoid opening the soft keyboard)
const useRunTopic = () => {
  const conversation = useConversation()
  const composer = useComposer()
  const isMobile = useIsMobile()
  return (key: TopicKey) => {
    conversation.run(key)
    if (!isMobile()) composer.focus()
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

const HeroFull = (props: { titleId: string }) => {
  const profile = useProfile()

  return (
    <div class="flex max-w-[640px] flex-col">
      <p class="text-primary text-[10.5px] leading-normal tracking-[.16em] uppercase md:text-[11.5px]">
        {profile().heroEyebrow}
      </p>
      <h1
        id={props.titleId}
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

const HeroSlim = (props: { nameId: string }) => {
  const profile = useProfile()

  return (
    <div class="flex flex-wrap items-baseline gap-x-[10px] gap-y-[6px] px-[14px] pt-[9px] pb-[10px] md:items-center md:gap-[18px] md:px-[38px] md:py-[13px]">
      <h1
        id={props.nameId}
        class="text-foreground text-[12px] font-bold whitespace-nowrap md:text-[12.5px]"
      >
        {profile().name}
      </h1>
      <HeroChips
        class="ml-auto flex flex-wrap gap-[6px] md:ml-0 md:gap-2"
        chipClass={SLIM_CHIP_CLASS}
      />
    </div>
  )
}

export const Hero = () => {
  const conversation = useConversation()
  const collapsed = conversation.hasMessages
  const titleId = createUniqueId()
  const nameId = createUniqueId()
  const [animate, setAnimate] = createSignal(false, { name: 'heroAnimate' })

  // Double rAF: the first frame paints the settled state (incl. a deep link's syncUrl collapse) without
  // transitions, so turning them on in the next frame can't animate that initial snap
  onSettled(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setAnimate(true))
    })
    return () => cancelAnimationFrame(frame)
  })

  const variantState = (active: boolean) => ({
    'grid-rows-[1fr] opacity-100': active,
    'grid-rows-[0fr] opacity-0': !active,
  })

  return (
    <section
      data-state={collapsed() ? 'collapsed' : 'full'}
      data-animate={animate() ? '' : undefined}
      aria-labelledby={collapsed() ? nameId : titleId}
      class="group/hero border-border data-[state=collapsed]:bg-card relative z-10 border-b [overflow-anchor:none] data-[state=collapsed]:sticky data-[state=collapsed]:top-0"
    >
      <div class={[VARIANT_CLASS, variantState(!collapsed())]} inert={collapsed()}>
        <div class="min-h-0 overflow-hidden">
          <div class="px-[18px] pt-6 pb-[22px] md:px-[38px] md:pt-[34px] md:pb-8">
            <HeroFull titleId={titleId} />
          </div>
        </div>
      </div>
      <div class={[VARIANT_CLASS, variantState(collapsed())]} inert={!collapsed()}>
        <div class="min-h-0 overflow-hidden">
          <HeroSlim nameId={nameId} />
        </div>
      </div>
    </section>
  )
}
