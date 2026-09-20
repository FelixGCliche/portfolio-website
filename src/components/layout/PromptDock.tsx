import { For } from 'solid-js'

const KEY_HINTS = [
  { key: '⌘K', label: 'palette' },
  { key: '↑↓', label: 'history' },
  { key: 'tab', label: 'completes' },
  { key: 'esc', label: 'clears' },
]

export const PromptDock = () => {
  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
  }

  return (
    <form
      class="border-border flex-none border-t px-3 pt-3 pb-3 sm:px-6 lg:px-10"
      onSubmit={handleSubmit}
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
          class="text-foreground placeholder:text-muted-foreground/80 min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm"
        />
        <button
          type="submit"
          aria-label="Send command"
          class="border-border text-muted-foreground hover:text-primary hover:border-primary focus-visible:ring-ring size-11 flex-none border focus-visible:ring-2 focus-visible:outline-none lg:h-6 lg:w-7"
        >
          <span aria-hidden="true">↵</span>
        </button>
      </div>
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
