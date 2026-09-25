import { createEffect, createSignal, Show } from 'solid-js'

import { useComposer } from './ComposerProvider'

const SINGLE_COLUMN = /^[\x20-\x7E]*$/

type CaretState = { left: number; width: number; visible: boolean }

const HIDDEN: CaretState = { left: 0, width: 0, visible: false }

export type BlockCaretProps = {
  input: HTMLInputElement | undefined
}

export const BlockCaret = (props: BlockCaretProps) => {
  const { value } = useComposer()
  const [caret, setCaret] = createSignal<CaretState>(HIDDEN, {
    name: 'blockCaret',
    equals: (a, b) => a.left === b.left && a.width === b.width && a.visible === b.visible,
  })
  let context: CanvasRenderingContext2D | null = null
  let cellWidth = 0
  let inset = 0

  const measure = (input: HTMLInputElement) => {
    const style = getComputedStyle(input)
    context ??= document.createElement('canvas').getContext('2d')
    if (!context) return
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    cellWidth = context.measureText('0').width + (parseFloat(style.letterSpacing) || 0)
    inset = parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth)
  }

  const hide = (input: HTMLInputElement) => {
    delete input.dataset.caret
    setCaret(HIDDEN)
  }

  const update = (input: HTMLInputElement) => {
    const start = input.selectionStart
    const active =
      start !== null &&
      start === input.selectionEnd &&
      cellWidth > 0 &&
      document.activeElement === input &&
      !window.matchMedia('(forced-colors: active)').matches &&
      SINGLE_COLUMN.test(input.value) &&
      input.scrollWidth <= input.clientWidth
    if (!active) {
      hide(input)
      return
    }
    input.dataset.caret = 'block'
    setCaret({
      left: inset + start * cellWidth - input.scrollLeft,
      width: cellWidth,
      visible: true,
    })
  }

  createEffect(
    () => props.input,
    (input) => {
      if (!input) return

      let frame = 0
      let disposed = false
      const sync = () => update(input)
      const syncNextFrame = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(sync)
      }
      const remeasure = () => {
        measure(input)
        update(input)
      }
      const blur = () => hide(input)
      const forcedColors = window.matchMedia('(forced-colors: active)')
      const events = ['keyup', 'click', 'select', 'pointerup', 'focus'] as const

      measure(input)
      update(input)
      for (const type of events) input.addEventListener(type, sync)
      input.addEventListener('keydown', syncNextFrame)
      input.addEventListener('blur', blur)
      window.addEventListener('resize', remeasure)
      forcedColors.addEventListener('change', sync)
      document.fonts.addEventListener('loadingdone', remeasure)
      void document.fonts.ready.then(() => {
        if (!disposed) remeasure()
      })

      return () => {
        disposed = true
        cancelAnimationFrame(frame)
        for (const type of events) input.removeEventListener(type, sync)
        input.removeEventListener('keydown', syncNextFrame)
        input.removeEventListener('blur', blur)
        window.removeEventListener('resize', remeasure)
        forcedColors.removeEventListener('change', sync)
        document.fonts.removeEventListener('loadingdone', remeasure)
        delete input.dataset.caret
      }
    },
    { name: 'blockCaretListeners' }
  )

  createEffect(
    () => ({ input: props.input, value: value() }),
    ({ input }) => {
      if (input) update(input)
    },
    { name: 'blockCaretSync' }
  )

  return (
    <Show when={caret().visible}>
      <span
        aria-hidden="true"
        class="bg-primary/70 animate-caret-blink pointer-events-none absolute top-1/2 h-[1lh] -translate-y-1/2 motion-reduce:animate-none forced-colors:hidden"
        style={{ left: `${caret().left}px`, width: `${caret().width}px` }}
      />
    </Show>
  )
}
