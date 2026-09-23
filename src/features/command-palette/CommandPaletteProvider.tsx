import { createContext, createSignal, useContext } from 'solid-js'
import type { Accessor, ParentProps, Setter } from 'solid-js'

import { useHotkey } from '@hooks'

export type CommandPaletteContextValue = {
  open: Accessor<boolean>
  setOpen: Setter<boolean>
  toggle: () => void
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue>()

export const useCommandPalette = () => useContext(CommandPaletteContext)

export const CommandPaletteProvider = (props: ParentProps) => {
  const [open, setOpen] = createSignal(false, { name: 'commandPaletteOpen' })

  const toggle = () => setOpen((value) => !value)

  useHotkey('mod+k', toggle)

  const value: CommandPaletteContextValue = { open, setOpen, toggle }

  return <CommandPaletteContext value={value}>{props.children}</CommandPaletteContext>
}
