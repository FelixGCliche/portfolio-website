import { createSignal, onCleanup, Show } from 'solid-js'

import { Button } from '@components'
import { useI18n } from '@features/i18n'

const COPIED_MS = 2000

const CopyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="square"
    aria-hidden="true"
  >
    <rect x="5.5" y="5.5" width="8" height="8" />
    <path d="M10.5 3.5v-1h-8v8h1" />
  </svg>
)

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="square"
    aria-hidden="true"
  >
    <path d="M3 8.5l3 3 7-7" />
  </svg>
)

export type CopyButtonProps = {
  // The text to copy, or a function producing it at click time
  value: string | (() => string)
  // Visible label; without it the button is icon-only
  label?: string
  // Accessible name for the icon-only button; defaults to the translated 'Copy'
  ariaLabel?: string
}

export const CopyButton = (props: CopyButtonProps) => {
  const { t } = useI18n()
  const [copied, setCopied] = createSignal(false, { name: 'copyButtonCopied' })
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  onCleanup(() => clearTimeout(resetTimer))

  const copy = async () => {
    const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard
    if (!clipboard) return
    const text = typeof props.value === 'function' ? props.value() : props.value
    try {
      await clipboard.writeText(text)
    } catch {
      return
    }
    setCopied(true)
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => setCopied(false), COPIED_MS)
  }

  return (
    <Button
      variant="outline"
      size={props.label ? 'sm' : 'icon'}
      aria-label={props.label ? undefined : (props.ariaLabel ?? t('blocks.copy'))}
      onClick={() => void copy()}
    >
      <Show when={copied()} fallback={<CopyIcon />}>
        <CheckIcon />
      </Show>
      <Show when={props.label}>
        <span>{copied() ? t('blocks.copied') : props.label}</span>
      </Show>
      <span class="sr-only" aria-live="polite">
        {copied() ? t('blocks.copied') : ''}
      </span>
    </Button>
  )
}
