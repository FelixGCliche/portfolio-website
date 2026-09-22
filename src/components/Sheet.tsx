// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { createEffect } from 'solid-js'
import type { ParentProps } from 'solid-js'

export type SheetProps = ParentProps<{
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  id?: string
  class?: ComponentProps<'div'>['class']
}>

export const Sheet = (props: SheetProps) => {
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
        'bg-background text-foreground border-border backdrop:bg-background/60 m-0 mr-auto h-dvh max-h-none w-[min(84%,20rem)] max-w-none -translate-x-full overscroll-contain border-r p-0 opacity-0 transition-[opacity,translate,overlay,display] transition-discrete duration-200 ease-out open:translate-x-0 open:opacity-100 motion-reduce:transition-none starting:open:-translate-x-full starting:open:opacity-0',
        props.class,
      ]}
    >
      <div class="pt-safe pb-safe flex h-full min-h-0 flex-col">{props.children}</div>
    </dialog>
  )
}
