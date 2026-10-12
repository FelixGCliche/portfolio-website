import { formatForDisplay } from '@tanstack/hotkeys'
import { createMemo, createSignal, For, onSettled, Show } from 'solid-js'

import { useAgent } from '@features/agent'
import { useConversation } from '@features/conversation'
import { useI18n } from '@features/i18n'
import type { UiKey } from '@features/i18n'
import { usePreferences } from '@features/preferences'
import { resolveInput } from '@features/topics'
import { useHotkey } from '@hooks'

import { BlockCaret } from './BlockCaret'
import { findCommand, matchCommands, useComposerCommands } from './commands'
import { useComposer } from './ComposerProvider'
import { Suggestions, SUGGESTIONS_ID, suggestionOptionId } from './Suggestions'
import { useCommandHistory } from './useCommandHistory'

const KEY_HINTS: { key: string; label: UiKey }[] = [
  { key: '↑↓', label: 'keyhints.history' },
  { key: 'tab', label: 'keyhints.complete' },
  { key: 'esc', label: 'keyhints.clear' },
]

const BUTTON_BASE_CLASS =
  'border-border text-foreground hover:text-primary hover:border-primary focus-visible:ring-ring flex-none border focus-visible:ring-2 focus-visible:outline-none'

const SEND_BUTTON_CLASS = `${BUTTON_BASE_CLASS} size-11 md:h-6 md:w-7`

const RETRY_BUTTON_CLASS = `${BUTTON_BASE_CLASS} min-h-11 px-2 md:min-h-6`

export const Composer = () => {
  // Client-only app: the platform is known at render time
  const paletteLabel = formatForDisplay('Mod+K')

  const conversation = useConversation()
  const agent = useAgent()
  const preferences = usePreferences()
  const { t } = useI18n()
  const commands = useComposerCommands()
  const history = useCommandHistory()
  const { value, setValue, focus, registerInput } = useComposer()
  // The unknown command that failed, rendered through t() so the message follows the locale
  const [error, setError] = createSignal('', { name: 'promptError' })
  const errorMessage = () => (error() ? t('composer.commandNotFound', { command: error() }) : '')
  // True from a question until a command runs, the composer is cleared or the thread is cleared:
  // gates the retry offer
  const [asked, setAsked] = createSignal(false, { name: 'promptAsked' })
  const loading = () => agent.isLoading()
  const canRetry = () => asked() && agent.hasError() && !loading()
  // A question submitted while a reply streams: kept in the input, with a hint until the reply ends
  const [blocked, setBlocked] = createSignal(false, { name: 'promptBlocked' })
  const isBlocked = () => blocked() && loading()
  const clearStatus = () => {
    setError('')
    setBlocked(false)
  }
  // One line, by precedence: command error, busy hint, then the failed-question retry offer
  const status = () =>
    errorMessage() ||
    (isBlocked() ? t('composer.busy') : '') ||
    (canRetry() ? t('composer.askFailed') : '')
  const showRetry = () => canRetry() && !errorMessage() && !isBlocked()
  const [focused, setFocused] = createSignal(false, { name: 'promptFocused' })
  const [dismissed, setDismissed] = createSignal(false, { name: 'suggestionsDismissed' })
  const [active, setActive] = createSignal(0, { name: 'suggestionActive' })
  // True once the user explicitly picks a suggestion with the arrow keys
  const [navigated, setNavigated] = createSignal(false, { name: 'suggestionNavigated' })
  const [input, setInput] = createSignal<HTMLInputElement | undefined>(undefined, {
    name: 'promptInputEl',
  })

  const matches = createMemo(
    () => (value().startsWith('/') ? matchCommands(value(), commands()) : []),
    {
      name: 'suggestionMatches',
    }
  )
  // A lone suggestion identical to the input has nothing left to offer
  const completed = createMemo(
    () => matches().length === 1 && matches()[0].key === value().toLowerCase(),
    { name: 'suggestionCompleted' }
  )
  const open = createMemo(() => focused() && !dismissed() && matches().length > 0 && !completed(), {
    name: 'suggestionsOpen',
  })
  const activeIndex = createMemo(() => Math.max(0, Math.min(active(), matches().length - 1)), {
    name: 'suggestionActiveIndex',
  })
  const activeMatch = createMemo(() => (open() ? matches()[activeIndex()] : undefined), {
    name: 'suggestionActiveMatch',
  })

  const activeOptionId = () => {
    const match = activeMatch()
    return match ? suggestionOptionId(match.key) : undefined
  }

  const accept = (key: string) => {
    setValue(key)
    setActive(0)
    setNavigated(false)
    setError('')
  }

  const recall = (entry: string) => {
    setValue(entry)
    setNavigated(false)
    setDismissed(true)
  }

  // The thread can be cleared from outside the composer (palette, hotkey): drop the stale retry offer
  onSettled(() => conversation.onClear(() => setAsked(false)))

  const settle = (raw: string) => {
    history.push(raw)
    setValue('')
    setNavigated(false)
    clearStatus()
  }

  const handleSubmit = (input: string) => {
    const resolved = resolveInput(input, (key) => findCommand(key, commands()))
    if (resolved.kind === 'empty') return
    if (resolved.kind === 'unknown') {
      setError(resolved.raw)
      return
    }
    if (resolved.kind === 'ask') {
      // Commands still run mid-stream, but a question waits for the reply: keep the text and say why
      if (loading()) {
        setBlocked(true)
        return
      }
      agent.ask(resolved.raw)
      setAsked(true)
      settle(resolved.raw)
      return
    }

    const { command, raw } = resolved
    setAsked(false)
    switch (command.kind) {
      case 'topic':
        conversation.run(command.key)
        break
      case 'theme':
        preferences.toggleTheme()
        break
      case 'lang':
        preferences.toggleLang()
        break
      case 'clear':
        conversation.clear()
        break
      default: {
        const unhandled: never = command
        throw new Error(`unhandled command: ${JSON.stringify(unhandled)}`)
      }
    }

    settle(raw)
  }

  const hotkeyOptions = { target: input, preventDefault: false, ignoreInputs: false }

  // Arrows only cycle when there is an actual choice to make; otherwise they walk history
  const canCycle = () => open() && matches().length > 1

  const cycle = (step: number) => {
    const count = matches().length
    setActive((activeIndex() + step + count) % count)
    setNavigated(true)
  }

  const walkHistory = (event: KeyboardEvent, entry: string | undefined) => {
    if (entry === undefined) return
    event.preventDefault()
    recall(entry)
  }

  useHotkey(
    'ArrowUp',
    (event) => {
      if (canCycle()) {
        event.preventDefault()
        cycle(-1)
      } else walkHistory(event, history.prev(value()))
    },
    hotkeyOptions
  )

  useHotkey(
    'ArrowDown',
    (event) => {
      if (canCycle()) {
        event.preventDefault()
        cycle(1)
      } else walkHistory(event, history.next())
    },
    hotkeyOptions
  )

  useHotkey(
    'Tab',
    (event) => {
      const match = activeMatch()
      if (!match || value() === match.key) return
      event.preventDefault()
      accept(match.key)
    },
    hotkeyOptions
  )

  useHotkey(
    'Enter',
    (event) => {
      if (event.isComposing) return
      // Without explicit arrow navigation, fall through to the native form submit of the literal input
      const match = activeMatch()
      if (!match || !navigated()) return
      event.preventDefault()
      handleSubmit(match.key)
    },
    hotkeyOptions
  )

  useHotkey(
    'Escape',
    (event) => {
      if (loading()) {
        event.preventDefault()
        agent.stop()
        return
      }
      if (open()) {
        event.preventDefault()
        setDismissed(true)
        return
      }
      history.reset()
      if (!value() && !error() && !canRetry()) return
      event.preventDefault()
      setValue('')
      clearStatus()
      setAsked(false)
    },
    hotkeyOptions
  )

  return (
    <form
      class="border-border flex-none border-t px-3 pt-3 pb-3 sm:px-6 md:px-10"
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmit(value())
      }}
    >
      <div class="border-border bg-card focus-within:border-primary focus-within:ring-primary relative flex cursor-text items-center gap-3 border px-3 py-3 focus-within:ring-1">
        <Show when={open()}>
          <Suggestions
            items={matches()}
            active={activeIndex()}
            onSelect={(key) => {
              accept(key)
              focus()
            }}
          />
        </Show>
        <span class="text-success flex-none" aria-hidden="true">
          ›
        </span>
        <label for="promptInput" class="sr-only">
          {t('composer.label')}
        </label>
        <div class="relative min-w-0 flex-1 text-base md:text-sm">
          <input
            ref={(el) => {
              registerInput(el)
              setInput(el)
            }}
            id="promptInput"
            name="command"
            type="text"
            placeholder={t('composer.placeholderAsk')}
            aria-busy={loading() ? 'true' : undefined}
            autocomplete="off"
            spellcheck={false}
            autocapitalize="off"
            value={value()}
            aria-invalid={error() ? 'true' : undefined}
            aria-describedby="promptError"
            role="combobox"
            aria-expanded={open() ? 'true' : 'false'}
            aria-controls={open() ? SUGGESTIONS_ID : undefined}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId()}
            onInput={(event) => {
              setValue(event.currentTarget.value)
              clearStatus()
              setActive(0)
              setNavigated(false)
              setDismissed(false)
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            class="text-foreground placeholder:text-muted-foreground w-full min-w-0 bg-transparent outline-none"
          />
          <BlockCaret input={input()} />
        </div>
        {/* One element for send and stop, so focus survives the reply ending on its own */}
        <button
          type={loading() ? 'button' : 'submit'}
          aria-label={loading() ? t('composer.stop') : t('composer.send')}
          class={SEND_BUTTON_CLASS}
          onClick={(event) => {
            if (!loading()) return
            // Stopping flips the type back to submit: never let this click submit the form
            event.preventDefault()
            agent.stop()
            focus()
          }}
        >
          <span aria-hidden="true">{loading() ? '■' : '↵'}</span>
        </button>
      </div>
      <div class={['flex items-center gap-3 text-xs', { 'pt-2': !!status() }]}>
        <p
          id="promptError"
          role="status"
          aria-live="polite"
          class="text-destructive m-0 min-w-0 break-all"
        >
          {status()}
        </p>
        <Show when={showRetry()}>
          <button
            type="button"
            onClick={() => {
              agent.retry()
              focus()
            }}
            class={RETRY_BUTTON_CLASS}
          >
            {t('composer.retry')}
          </button>
        </Show>
      </div>
      <ul class="text-muted-foreground m-0 hidden list-none flex-wrap gap-x-5 gap-y-1 p-0 pt-2.5 text-[11px] md:flex">
        <li class="whitespace-nowrap">
          <kbd class="text-foreground">{paletteLabel}</kbd> {t('keyhints.palette')}
        </li>
        <For each={KEY_HINTS}>
          {(hint) => (
            <li class="whitespace-nowrap">
              <kbd class="text-foreground">{hint.key}</kbd> {t(hint.label)}
            </li>
          )}
        </For>
      </ul>
    </form>
  )
}
