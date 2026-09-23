import { useNavigate } from '@tanstack/solid-router'
import { createMemo, createSignal, For, Show } from 'solid-js'

import { findSession, matchSessions } from '@features/sessions'
import type { Session } from '@features/sessions'
import { useModKeyLabel } from '@hooks'

import { BlockCaret } from './BlockCaret'
import { useComposer } from './ComposerProvider'
import { Suggestions, SUGGESTIONS_ID, suggestionOptionId } from './Suggestions'
import { useCommandHistory } from './useCommandHistory'

const KEY_HINTS = [
  { key: '↑↓', label: 'history' },
  { key: 'tab', label: 'completes' },
  { key: 'esc', label: 'clears' },
]

export const Composer = () => {
  const navigate = useNavigate()
  const history = useCommandHistory()
  const { value, setValue, focus, registerInput } = useComposer()
  const paletteShortcut = useModKeyLabel('K')
  const [error, setError] = createSignal('', { name: 'promptError' })
  const [focused, setFocused] = createSignal(false, { name: 'promptFocused' })
  const [dismissed, setDismissed] = createSignal(false, { name: 'suggestionsDismissed' })
  const [active, setActive] = createSignal(0, { name: 'suggestionActive' })
  const [input, setInput] = createSignal<HTMLInputElement | undefined>(undefined, {
    name: 'promptInputEl',
  })

  const matches = createMemo(() => (value().startsWith('/') ? matchSessions(value()) : []), {
    name: 'suggestionMatches',
  })
  const open = createMemo(() => focused() && !dismissed() && matches().length > 0, {
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

  const accept = (key: Session['key']) => {
    setValue(key)
    setActive(0)
    setError('')
  }

  const recall = (entry: string) => {
    setValue(entry)
    setDismissed(true)
  }

  const handleSubmit = (input: string) => {
    const command = input.trim()
    if (!command) return
    const session = findSession(command)
    if (!session) {
      setError(`command not found: ${command}`)
      return
    }
    void navigate({ to: session.key })
    history.push(command)
    setValue('')
    setError('')
  }

  const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    if (event.isComposing) return
    const match = activeMatch()
    if (match) {
      const count = matches().length
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        const step = event.key === 'ArrowUp' ? -1 : 1
        setActive((activeIndex() + step + count) % count)
        return
      }
      if (event.key === 'Tab' && !event.shiftKey && value() !== match.key) {
        event.preventDefault()
        accept(match.key)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        accept(match.key)
        handleSubmit(match.key)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setDismissed(true)
        return
      }
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const entry = history.prev(event.currentTarget.value)
      if (entry !== undefined) recall(entry)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const entry = history.next()
      if (entry !== undefined) recall(entry)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      history.reset()
      setValue('')
      setError('')
    }
  }

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
        <div class="relative min-w-0 flex-1 text-base md:text-sm">
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
            aria-controls={SUGGESTIONS_ID}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId()}
            onInput={(event) => {
              setValue(event.currentTarget.value)
              setError('')
              setActive(0)
              setDismissed(false)
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            class="text-foreground placeholder:text-muted-foreground/80 w-full min-w-0 bg-transparent text-base outline-none md:text-sm"
          />
          <BlockCaret input={input()} />
        </div>
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
          <kbd class="text-foreground">{paletteShortcut()}</kbd> palette
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
