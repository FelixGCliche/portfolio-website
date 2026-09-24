import type { HotkeyCallback, RegisterableHotkey } from '@tanstack/hotkeys'

import { useHotkeys } from './useHotkeys'
import type { UseHotkeyOptions } from './useHotkeys'

export const useHotkey = (
  hotkey: RegisterableHotkey,
  callback: HotkeyCallback,
  options: UseHotkeyOptions = {}
) => useHotkeys([{ hotkey, callback }], options)
