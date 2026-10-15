import { Check, Copy } from '@lucide/solid'
import { createSignal, onCleanup, Show } from 'solid-js'

import { Button } from '@components'
import { useI18n } from '@features/i18n'

const COPIED_MS = 2000

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
  const [status, setStatus] = createSignal<'idle' | 'copied' | 'failed'>('idle', {
    name: 'copyButtonStatus',
  })
  let resetTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  onCleanup(() => {
    disposed = true
    clearTimeout(resetTimer)
  })

  const report = (next: 'copied' | 'failed') => {
    if (disposed) return
    setStatus(next)
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      if (!disposed) setStatus('idle')
    }, COPIED_MS)
  }

  const copy = async () => {
    const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard
    if (!clipboard) {
      report('failed')
      return
    }
    try {
      const text = typeof props.value === 'function' ? props.value() : props.value
      await clipboard.writeText(text)
    } catch {
      report('failed')
      return
    }
    report('copied')
  }

  const message = () =>
    status() === 'copied' ? t('blocks.copied') : status() === 'failed' ? t('blocks.copyFailed') : ''

  return (
    <span class="inline-flex">
      <Button
        variant="outline"
        size={props.label ? 'sm' : 'icon'}
        aria-label={props.label ? undefined : (props.ariaLabel ?? t('blocks.copy'))}
        onClick={() => void copy()}
      >
        <Show
          when={status() === 'copied'}
          fallback={<Copy aria-hidden="true" size={16} strokeWidth={1.5} />}
        >
          <Check aria-hidden="true" size={16} strokeWidth={1.5} />
        </Show>
        <Show when={props.label}>
          <span aria-hidden={status() === 'idle' ? undefined : 'true'}>
            {message() || props.label}
          </span>
        </Show>
      </Button>
      {/* Stable live region outside the button so the status is announced exactly once */}
      <span class="sr-only" role="status" aria-live="polite">
        {message()}
      </span>
    </span>
  )
}
