import { formatForDisplay } from '@tanstack/hotkeys'
import { useNavigate } from '@tanstack/solid-router'
import { createMemo, createSignal, For, Show } from 'solid-js'

import { usePreferences } from '@features/preferences'
import { useHotkey } from '@hooks'

import { findCommand, matchCommands } from './commands'
import { useComposer } from './ComposerProvider'
import { Suggestions, SUGGESTIONS_ID, suggestionOptionId } from './Suggestions'
import { useCommandHistory } from './useCommandHistory'

const KEY_HINTS = [
  { key: '↑↓', label: 'history' },
  { key: 'tab', label: 'completes' },
  { key: 'esc', label: 'clears' },
]

export const Composer = () => {
  // Client-only app: the platform is known at render time
  const paletteLabel = formatForDisplay('Mod+K')

  const navigate = useNavigate()
  const preferences = usePreferences()
  const history = useCommandHistory()
  const { value, setValue, focus, registerInput } = useComposer()
  const [error, setError] = createSignal('', { name: 'promptError' })
  const [focused, setFocused] = createSignal(false, { name: 'promptFocused' })
  const [dismissed, setDismissed] = createSignal(false, { name: 'suggestionsDismissed' })
  const [active, setActive] = createSignal(0, { name: 'suggestionActive' })
  // True once the user explicitly picks a suggestion with the arrow keys
  const [navigated, setNavigated] = createSignal(false, { name: 'suggestionNavigated' })
  const [input, setInput] = createSignal<HTMLInputElement | undefined>(undefined, {
    name: 'promptInputEl',
  })

  const matches = createMemo(() => (value().startsWith('/') ? matchCommands(value()) : []), {
    name: 'suggestionMatches',
  })
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

  const handleSubmit = (input: string) => {
    const raw = input.trim()
    if (!raw) return
    const command = findCommand(raw)
    if (!command) {
      setError(`command not found: ${raw}`)
      return
    }

    if (command.kind === 'session') void navigate({ to: command.key })
    else if (command.kind === 'theme') preferences.toggleTheme()
    else preferences.toggleLang()

    history.push(raw)
    setValue('')
    setNavigated(false)
    setError('')
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
      if (open()) {
        event.preventDefault()
        setDismissed(true)
        return
      }
      history.reset()
      if (!value() && !error()) return
      event.preventDefault()
      setValue('')
      setError('')
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
      <div class="border-border bg-background focus-within:border-primary focus-within:ring-primary relative flex items-center gap-3 border px-3 py-3 focus-within:ring-1">
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
          Command
        </label>
        <input
          ref={(el) => {
            registerInput(el)
            setInput(el)
          }}
          id="promptInput"
          name="command"
          type="text"
          placeholder="type a command, e.g. /about"
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
            setError('')
            setActive(0)
            setNavigated(false)
            setDismissed(false)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          class="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm"
        />
        <button
          type="submit"
          aria-label="Send command"
          class="border-border text-muted-foreground hover:text-primary hover:border-primary focus-visible:ring-ring size-11 flex-none border focus-visible:ring-2 focus-visible:outline-none md:h-6 md:w-7"
        >
          <span aria-hidden="true">↵</span>
        </button>
      </div>
      <p
        id="promptError"
        role="status"
        aria-live="polite"
        class={['text-destructive m-0 text-xs break-all', { 'pt-2': !!error() }]}
      >
        {error()}
      </p>
      <ul class="text-muted-foreground m-0 hidden list-none flex-wrap gap-x-5 gap-y-1 p-0 pt-2.5 text-[11px] md:flex">
        <li class="whitespace-nowrap">
          <kbd class="text-foreground">{paletteLabel}</kbd> palette
        </li>
        <For each={KEY_HINTS}>
          {(hint) => (
            <li class="whitespace-nowrap">
              <kbd class="text-foreground">{hint.key}</kbd> {hint.label}
            </li>
          )}
        </For>
      </ul>
    </form>
  )
}
