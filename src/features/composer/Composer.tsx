import { useNavigate } from '@tanstack/solid-router'
import { createSignal, For } from 'solid-js'

import { findSession } from '@features/sessions'

import { useCommandHistory } from './useCommandHistory'

const KEY_HINTS = [
  { key: '⌘K', label: 'palette' },
  { key: '↑↓', label: 'history' },
  { key: 'tab', label: 'completes' },
  { key: 'esc', label: 'clears' },
]

export const Composer = () => {
  const navigate = useNavigate()
  const history = useCommandHistory()
  const [value, setValue] = createSignal('', { name: 'promptValue' })
  const [error, setError] = createSignal('', { name: 'promptError' })

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
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const entry = history.prev(event.currentTarget.value)
      if (entry !== undefined) setValue(entry)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const entry = history.next()
      if (entry !== undefined) setValue(entry)
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
      <div class="border-border bg-background focus-within:border-primary focus-within:ring-primary flex items-center gap-3 border px-3 py-3 focus-within:ring-1">
        <span class="text-success flex-none" aria-hidden="true">
          ›
        </span>
        <label for="promptInput" class="sr-only">
          Command
        </label>
        <input
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
          onInput={(event) => {
            setValue(event.currentTarget.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          class="text-foreground placeholder:text-muted-foreground/80 min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm"
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
