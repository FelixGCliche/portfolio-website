import { getHotkeyManager } from '@tanstack/hotkeys'
import type {
  HotkeyCallback,
  HotkeyOptions,
  HotkeyRegistrationHandle,
  RegisterableHotkey,
} from '@tanstack/hotkeys'
import { createEffect } from 'solid-js'
import type { Accessor } from 'solid-js'

export type HotkeyTarget = NonNullable<HotkeyOptions['target']>

export type UseHotkeyOptions = Omit<HotkeyOptions, 'enabled' | 'target'> & {
  enabled?: boolean | Accessor<boolean>
  target?: HotkeyTarget | null | Accessor<HotkeyTarget | null | undefined>
}

export type UseHotkeyDefinition = {
  hotkey: RegisterableHotkey
  callback: HotkeyCallback
  options?: UseHotkeyOptions
}

const resolveTarget = (target: UseHotkeyOptions['target']) => {
  if (target === undefined) return typeof document === 'undefined' ? null : document
  return (typeof target === 'function' ? target() : target) ?? null
}

const resolveEnabled = (enabled: UseHotkeyOptions['enabled']) =>
  typeof enabled === 'function' ? enabled() : (enabled ?? true)

const useRegistration = (definition: UseHotkeyDefinition, commonOptions: UseHotkeyOptions) => {
  const { enabled, target, ...options } = { ...commonOptions, ...definition.options }
  let handle: HotkeyRegistrationHandle | undefined
  let isEnabled = true

  createEffect(
    () => resolveEnabled(enabled),
    (value) => {
      isEnabled = value
      handle?.setOptions({ enabled: value })
    },
    { name: 'hotkeyEnabled' }
  )

  createEffect(
    () => resolveTarget(target),
    (element) => {
      if (!element) return
      const registration = getHotkeyManager().register(definition.hotkey, definition.callback, {
        ...options,
        enabled: isEnabled,
        target: element,
      })
      handle = registration
      return () => {
        registration.unregister()
        if (handle === registration) handle = undefined
      }
    },
    { name: 'hotkeyTarget' }
  )
}

export const useHotkeys = (
  definitions: readonly UseHotkeyDefinition[],
  commonOptions: UseHotkeyOptions = {}
) => {
  for (const definition of definitions) useRegistration(definition, commonOptions)
}
