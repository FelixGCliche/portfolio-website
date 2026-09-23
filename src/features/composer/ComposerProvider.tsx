import { createContext, createSignal, useContext } from 'solid-js'
import type { Accessor, ParentProps, Setter } from 'solid-js'

export type ComposerContextValue = {
  value: Accessor<string>
  setValue: Setter<string>
  focus: () => void
  clear: () => void
  registerInput: (el: HTMLInputElement) => void
}

export const ComposerContext = createContext<ComposerContextValue>()

export const useComposer = () => useContext(ComposerContext)

export const ComposerProvider = (props: ParentProps) => {
  const [value, setValue] = createSignal('', { name: 'promptValue' })
  let input: HTMLInputElement | undefined

  const registerInput = (el: HTMLInputElement) => {
    input = el
  }

  const focus = () => input?.focus()

  const clear = () => setValue('')

  const composer: ComposerContextValue = { value, setValue, focus, clear, registerInput }

  return <ComposerContext value={composer}>{props.children}</ComposerContext>
}
