// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { createEffect } from 'solid-js'
import type { ParentProps } from 'solid-js'

export type DialogProps = ParentProps<{
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  id?: string
  class?: ComponentProps<'div'>['class']
}>

export const Dialog = (props: DialogProps) => {
  let dialog!: HTMLDialogElement

  createEffect(
    () => props.open,
    (open) => {
      if (open) {
        if (!dialog.open) dialog.showModal()
      } else if (dialog.open) {
        dialog.close()
      }
    }
  )

  const handleClose = () => props.onOpenChange(false)

  const handleClick = (event: MouseEvent) => {
    if (event.target === dialog) props.onOpenChange(false)
  }

  return (
    <dialog
      ref={(el) => {
        dialog = el
      }}
      id={props.id}
      aria-label={props.label}
      onClose={handleClose}
      onClick={handleClick}
      class={[
        'bg-popover text-popover-foreground border-border backdrop:bg-background/60 m-auto mt-[15dvh] w-[min(92%,36rem)] max-w-none scale-95 overscroll-contain border p-0 opacity-0 transition-[opacity,scale,overlay,display] transition-discrete duration-150 ease-out open:scale-100 open:opacity-100 motion-reduce:transition-none starting:open:scale-95 starting:open:opacity-0',
        props.class,
      ]}
    >
      <div class="flex min-h-0 flex-col">{props.children}</div>
    </dialog>
  )
}
