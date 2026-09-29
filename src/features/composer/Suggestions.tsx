import { createEffect, For } from 'solid-js'

export const SUGGESTIONS_ID = 'promptSuggestions'

export const suggestionOptionId = (key: string) => `${SUGGESTIONS_ID}-${key.slice(1)}`

export type SuggestionItem = { key: string; meta: string; desc: string }

export type SuggestionsProps = {
  items: SuggestionItem[]
  active: number
  onSelect: (key: string) => void
}

export const Suggestions = (props: SuggestionsProps) => {
  let listbox: HTMLUListElement | undefined

  createEffect(
    () => props.items[props.active]?.key,
    (key) => {
      if (!key || !listbox) return
      listbox.querySelector(`#${suggestionOptionId(key)}`)?.scrollIntoView({ block: 'nearest' })
    },
    { name: 'suggestionScroll' }
  )

  return (
    <ul
      ref={(el) => (listbox = el)}
      id={SUGGESTIONS_ID}
      role="listbox"
      aria-label="Command suggestions"
      class="bg-popover text-popover-foreground border-border absolute inset-x-0 bottom-full z-20 m-0 mb-1 list-none overflow-y-auto border text-xs"
    >
      <For each={props.items}>
        {(item, index) => (
          <li
            id={suggestionOptionId(item.key)}
            role="option"
            aria-selected={index() === props.active ? 'true' : 'false'}
            data-active={index() === props.active ? 'true' : 'false'}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => props.onSelect(item.key)}
            class="hover:bg-primary/10 data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-foreground flex min-w-0 cursor-pointer items-baseline gap-3 border-l-2 border-transparent px-3 py-2 md:py-1.5"
          >
            <span class="text-primary w-24 flex-none font-bold">{item.key}</span>
            <span class="text-muted-foreground min-w-0 truncate">{item.desc}</span>
          </li>
        )}
      </For>
    </ul>
  )
}
