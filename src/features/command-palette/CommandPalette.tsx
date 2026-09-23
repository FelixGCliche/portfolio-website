import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'

import { Dialog } from '@components'

import { useCommandPalette } from './CommandPaletteProvider'
import { COMMAND_GROUPS, filterCommands, useCommands } from './commands'
import type { CommandItem } from './commands'

const LISTBOX_ID = 'commandPaletteList'

const optionId = (item: CommandItem) => `${LISTBOX_ID}-${item.id}`

const FOOTER_HINTS = [
  { key: '↑↓', label: 'navigate' },
  { key: '↵', label: 'run' },
  { key: 'esc', label: 'close' },
]

export const CommandPalette = () => {
  const palette = useCommandPalette()
  const commands = useCommands()
  const [query, setQuery] = createSignal('', { name: 'commandPaletteQuery' })
  const [active, setActive] = createSignal(0, { name: 'commandPaletteActive' })
  let listbox: HTMLDivElement | undefined
  // Deferred until the dialog's close event: the native close restores focus to the
  // previously focused element, which would otherwise override focus set by the action.
  let pendingAction: (() => void) | undefined

  const results = createMemo(() => filterCommands(commands, query()), {
    name: 'commandPaletteResults',
  })
  const groups = createMemo(
    () =>
      COMMAND_GROUPS.map((group) => ({
        group,
        items: results().filter((item) => item.group === group),
      })).filter((entry) => entry.items.length > 0),
    { name: 'commandPaletteGroups' }
  )
  const activeIndex = createMemo(() => Math.max(0, Math.min(active(), results().length - 1)), {
    name: 'commandPaletteActiveIndex',
  })
  const activeItem = createMemo(() => results()[activeIndex()], {
    name: 'commandPaletteActiveItem',
  })

  createEffect(
    () => (palette.open() ? activeItem() : undefined),
    (item) => {
      if (!item || !listbox) return
      listbox.querySelector(`#${optionId(item)}`)?.scrollIntoView({ block: 'nearest' })
    },
    { name: 'commandPaletteScroll' }
  )

  const activeOptionId = () => {
    const item = activeItem()
    return item ? optionId(item) : undefined
  }

  const handleOpenChange = (open: boolean) => {
    palette.setOpen(open)
    if (open) return
    setQuery('')
    setActive(0)
    const action = pendingAction
    pendingAction = undefined
    action?.()
  }

  const run = (item: CommandItem) => {
    pendingAction = item.run
    palette.setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing) return
    const count = results().length
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (!count) return
      const step = event.key === 'ArrowUp' ? -1 : 1
      setActive((activeIndex() + step + count) % count)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = activeItem()
      if (item) run(item)
    }
  }

  return (
    <Dialog
      id="commandPalette"
      label="Command palette"
      open={palette.open()}
      onOpenChange={handleOpenChange}
    >
      <div class="border-border flex items-center gap-3 border-b px-3 py-3">
        <span class="text-success flex-none" aria-hidden="true">
          ›
        </span>
        <label for="commandPaletteInput" class="sr-only">
          Search commands
        </label>
        <input
          id="commandPaletteInput"
          type="text"
          placeholder="search sessions, actions, links"
          autofocus
          autocomplete="off"
          spellcheck={false}
          autocapitalize="off"
          value={query()}
          role="combobox"
          aria-expanded={results().length > 0 ? 'true' : 'false'}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId()}
          onInput={(event) => {
            setQuery(event.currentTarget.value)
            setActive(0)
          }}
          onKeyDown={handleKeyDown}
          class="text-foreground placeholder:text-muted-foreground/80 min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm"
        />
      </div>
      <div
        ref={(el) => (listbox = el)}
        id={LISTBOX_ID}
        role="listbox"
        aria-label="Commands"
        class="max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain py-1 text-xs"
      >
        <For each={groups()}>
          {(entry) => (
            <div role="group" aria-label={entry.group}>
              <div
                role="presentation"
                class="text-muted-foreground px-3 pt-2 pb-1 text-[10.5px] tracking-[0.16em] uppercase"
              >
                {entry.group}
              </div>
              <For each={entry.items}>
                {(item) => {
                  const selected = () => activeItem()?.id === item.id
                  return (
                    <div
                      id={optionId(item)}
                      role="option"
                      aria-selected={selected() ? 'true' : 'false'}
                      data-active={selected() ? 'true' : 'false'}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseMove={() => {
                        if (!selected()) setActive(results().indexOf(item))
                      }}
                      onClick={() => run(item)}
                      class="text-muted-foreground data-[active=true]:border-primary data-[active=true]:bg-muted data-[active=true]:text-foreground flex min-w-0 cursor-pointer items-baseline gap-3 border-l-2 border-transparent px-3 py-2 md:py-1.5"
                    >
                      <span class="text-foreground flex-none">{item.label}</span>
                      <Show when={item.hint}>
                        {(hint) => <span class="min-w-0 truncate">{hint()}</span>}
                      </Show>
                    </div>
                  )
                }}
              </For>
            </div>
          )}
        </For>
      </div>
      <Show when={results().length === 0}>
        <p class="text-muted-foreground m-0 px-3 py-2 text-xs">No matching commands</p>
      </Show>
      <ul class="border-border text-muted-foreground m-0 hidden list-none gap-x-5 border-t p-0 px-3 py-2 text-[11px] md:flex">
        <For each={FOOTER_HINTS}>
          {(hint) => (
            <li class="whitespace-nowrap">
              <kbd class="text-foreground">{hint.key}</kbd> {hint.label}
            </li>
          )}
        </For>
      </ul>
    </Dialog>
  )
}
