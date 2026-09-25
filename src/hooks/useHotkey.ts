import type { HotkeyCallback, RegisterableHotkey } from '@tanstack/hotkeys'

import { useHotkeys } from './useHotkeys'
import type { UseHotkeyOptions } from './useHotkeys'

/**
 * Solid 2 adapter over TanStack Hotkeys: registers one hotkey (`'Mod+K'`, `'Escape'`,
 * `{ key: 'S', mod: true }`) on the shared HotkeyManager for the lifetime of the current owner.
 */
export const useHotkey = (
  hotkey: RegisterableHotkey,
  callback: HotkeyCallback,
  options: UseHotkeyOptions = {}
) => useHotkeys([{ hotkey, callback }], options)
