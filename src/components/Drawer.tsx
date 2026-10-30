// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onSettled,
  Show,
  useContext,
} from 'solid-js'
import type { Accessor, ParentProps } from 'solid-js'

import { useHotkey } from '@hooks'

const DISMISS_THRESHOLD = 80
const TAP_SLOP = 6

export type DrawerDirection = 'top' | 'right' | 'bottom' | 'left'

export type DrawerContextValue = {
  open: Accessor<boolean>
  onOpenChange: (open: boolean) => void
  direction: Accessor<DrawerDirection>
  /**
   * Modal drawers open in the top layer with a backdrop and focus trap. Non-modal drawers open in
   * place, positioned against their nearest positioned ancestor, and leave the page interactive.
   */
  modal: Accessor<boolean>
  titleId: string
  descriptionId: string
  hasTitle: Accessor<boolean>
  hasDescription: Accessor<boolean>
  setHasTitle: (present: boolean) => void
  setHasDescription: (present: boolean) => void
}

export const DrawerContext = createContext<DrawerContextValue>()

export const useDrawer = () => {
  try {
    return useContext(DrawerContext)
  } catch {
    throw new Error('useDrawer must be used within <Drawer>')
  }
}

export type DrawerProps = ParentProps<{
  open: boolean
  onOpenChange: (open: boolean) => void
  direction?: DrawerDirection
  modal?: boolean
}>

export const Drawer = (props: DrawerProps) => {
  const [hasTitle, setHasTitle] = createSignal(false, { name: 'drawerHasTitle' })
  const [hasDescription, setHasDescription] = createSignal(false, {
    name: 'drawerHasDescription',
  })

  const value: DrawerContextValue = {
    open: () => props.open,
    onOpenChange: (open) => props.onOpenChange(open),
    direction: () => props.direction ?? 'bottom',
    modal: () => props.modal !== false,
    titleId: createUniqueId(),
    descriptionId: createUniqueId(),
    hasTitle,
    hasDescription,
    setHasTitle: (present) => setHasTitle(present),
    setHasDescription: (present) => setHasDescription(present),
  }

  return <DrawerContext value={value}>{props.children}</DrawerContext>
}

type DirectionConfig = {
  /** Drag axis that dismisses the drawer */
  axis: 'x' | 'y'
  /** Direction along the axis that dismisses the drawer; the handle sits on the inner edge */
  dismissSign: 1 | -1
  /** Colors, border and overflow shared by the modal dialog and the non-modal panel */
  skin: string
  /** Slide transition of the modal dialog */
  slide: string
  /** Size and placement when modal (top layer, viewport-anchored) */
  modalLayout: string
  /** Size and placement when non-modal (anchored to the nearest positioned ancestor) */
  inlineLayout: string
  /** Off-screen position of the non-modal panel while closed */
  panelClosed: string
  /** Layout of the content wrapper (safe areas, flex direction); spacing belongs to the sub-parts */
  layout: string
}

const HANDLE_BASE =
  'flex flex-none cursor-grab touch-none items-center justify-center active:cursor-grabbing'
const HORIZONTAL_HANDLE = `${HANDLE_BASE} min-h-11 w-full`
const VERTICAL_HANDLE = `${HANDLE_BASE} h-full min-w-11`
const HORIZONTAL_BAR = 'bg-border block h-1 w-10'
const VERTICAL_BAR = 'bg-border block h-10 w-1'

const SIDE_LAYOUT = 'pt-safe pb-safe flex h-full min-h-0 min-w-0 flex-1 flex-col'

const DIRECTIONS: Record<DrawerDirection, DirectionConfig> = {
  left: {
    axis: 'x',
    dismissSign: -1,
    skin: 'bg-background text-foreground border-r',
    slide: '-translate-x-full open:translate-x-0 starting:open:-translate-x-full',
    modalLayout: 'mr-auto h-dvh max-h-none w-[min(84%,20rem)]',
    inlineLayout: 'absolute inset-y-0 right-auto left-0 h-full max-h-none w-[min(100%,26rem)]',
    panelClosed: '-translate-x-full',
    layout: SIDE_LAYOUT,
  },
  right: {
    axis: 'x',
    dismissSign: 1,
    skin: 'bg-background text-foreground border-l',
    slide: 'translate-x-full open:translate-x-0 starting:open:translate-x-full',
    modalLayout: 'ml-auto h-dvh max-h-none w-[min(84%,20rem)]',
    inlineLayout: 'absolute inset-y-0 right-0 left-auto h-full max-h-none w-[min(100%,26rem)]',
    panelClosed: 'translate-x-full',
    layout: SIDE_LAYOUT,
  },
  bottom: {
    axis: 'y',
    dismissSign: 1,
    skin: 'bg-card text-card-foreground overflow-y-auto border border-b-0',
    slide: 'translate-y-full open:translate-y-0 starting:open:translate-y-full',
    modalLayout: 'mx-auto mt-auto max-h-[85dvh] w-[min(390px,100%)]',
    inlineLayout: 'absolute inset-x-0 top-auto bottom-0 mx-auto max-h-[85%] w-[min(390px,100%)]',
    panelClosed: 'translate-y-full',
    layout: 'pb-safe flex flex-col',
  },
  top: {
    axis: 'y',
    dismissSign: -1,
    skin: 'bg-card text-card-foreground overflow-y-auto border border-t-0',
    slide: '-translate-y-full open:translate-y-0 starting:open:-translate-y-full',
    modalLayout: 'mx-auto mb-auto max-h-[85dvh] w-[min(390px,100%)]',
    inlineLayout: 'absolute inset-x-0 top-0 bottom-auto mx-auto max-h-[85%] w-[min(390px,100%)]',
    panelClosed: '-translate-y-full',
    layout: 'pt-safe flex flex-col',
  },
}

export type DrawerContentProps = ParentProps<{
  /** Accessible name; a rendered DrawerTitle takes precedence through aria-labelledby */
  label?: string
  id?: string
  class?: ComponentProps<'div'>['class']
  /** Accessible label of the drag handle, which also closes the drawer on tap */
  closeLabel?: string
  /** Defaults to true for top and bottom drawers, false for side drawers */
  showHandle?: boolean
}>

export const DrawerContent = (props: DrawerContentProps) => {
  const drawer = useDrawer()

  let dialog: HTMLDialogElement | undefined
  let start = 0
  let pointerId: number | null = null
  let suppressClick = false

  const [dragOffset, setDragOffset] = createSignal<number | null>(null, {
    name: 'drawerDragOffset',
  })

  const config = () => DIRECTIONS[drawer.direction()]
  const dragging = createMemo(() => dragOffset() !== null, { name: 'drawerDragging' })
  const horizontal = () => config().axis === 'x'
  const showHandle = () => props.showHandle ?? !horizontal()

  // Only the modal drawer is a <dialog>; the non-modal panel is shown and hidden through classes alone
  createEffect(
    () => drawer.open() && drawer.modal(),
    (open) => {
      if (!dialog) return
      if (open) {
        if (!dialog.open) dialog.showModal()
      } else if (dialog.open) {
        dialog.close()
      }
    }
  )

  // The non-modal panel has no native Escape handling, and focus may sit outside it
  useHotkey(
    'Escape',
    (event) => {
      if (event.defaultPrevented) return
      // Leave Escape to a modal dialog stacked above (e.g. the command palette)
      if (document.querySelector('dialog:modal')) return
      drawer.onOpenChange(false)
    },
    {
      enabled: () => drawer.open() && !drawer.modal(),
      preventDefault: false,
      stopPropagation: false,
      ignoreInputs: false,
      conflictBehavior: 'allow',
    }
  )

  const handleClose = () => {
    setDragOffset(null)
    drawer.onOpenChange(false)
  }

  const handleClick = (event: MouseEvent) => {
    // A click on the dialog itself (not its content) is a click on the backdrop
    if (event.target === dialog) drawer.onOpenChange(false)
  }

  const pointerPosition = (event: PointerEvent) => (horizontal() ? event.clientX : event.clientY)

  /** Signed offset along the drag axis, clamped so the drawer only moves toward its dismiss direction */
  const offsetFor = (event: PointerEvent) => {
    const { dismissSign } = config()
    return dismissSign * Math.max(0, dismissSign * (pointerPosition(event) - start))
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    pointerId = event.pointerId
    start = pointerPosition(event)
    suppressClick = false
    try {
      ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    } catch {
      // Capture can fail (e.g. synthetic or already-released pointers); dragging still works without it.
    }
    setDragOffset(0)
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return
    const offset = offsetFor(event)
    if (Math.abs(offset) > TAP_SLOP) suppressClick = true
    setDragOffset(offset)
  }

  const endDrag = (event: PointerEvent, cancelled: boolean) => {
    if (pointerId !== event.pointerId) return
    pointerId = null
    const distance = Math.abs(offsetFor(event))
    setDragOffset(null)
    if (!cancelled && distance > DISMISS_THRESHOLD) drawer.onOpenChange(false)
  }

  const handleHandleClick = () => {
    if (suppressClick) {
      suppressClick = false
      return
    }
    drawer.onOpenChange(false)
  }

  const translate = () => {
    const offset = dragOffset()
    if (offset === null) return undefined
    return horizontal() ? `${offset}px 0` : `0 ${offset}px`
  }

  const handle = () => (
    <button
      type="button"
      aria-label={props.closeLabel ?? 'Close'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => endDrag(event, false)}
      onPointerCancel={(event) => endDrag(event, true)}
      onClick={handleHandleClick}
      class={horizontal() ? VERTICAL_HANDLE : HORIZONTAL_HANDLE}
    >
      <span aria-hidden="true" class={horizontal() ? VERTICAL_BAR : HORIZONTAL_BAR} />
    </button>
  )

  const content = () => <div class={config().layout}>{props.children}</div>

  // The handle sits on the inner edge: before the content when dismissing toward the positive end
  const handleFirst = () => config().dismissSign === 1

  const body = () => (
    <Show when={showHandle()} fallback={content()}>
      <div class={horizontal() ? 'flex h-full min-h-0 flex-row' : 'contents'}>
        <Show when={handleFirst()}>{handle()}</Show>
        {content()}
        <Show when={!handleFirst()}>{handle()}</Show>
      </div>
    </Show>
  )

  const labelledBy = () => (drawer.hasTitle() ? drawer.titleId : undefined)
  const describedBy = () => (drawer.hasDescription() ? drawer.descriptionId : undefined)

  // Always mounted, hidden off-screen and inert while closed. Unlike dialog.show(), toggling it
  // never moves focus, so it can't scroll a clipping ancestor.
  const panel = () => (
    <aside
      id={props.id}
      aria-label={props.label}
      aria-labelledby={labelledBy()}
      aria-describedby={describedBy()}
      inert={!drawer.open()}
      style={{ translate: translate() }}
      class={[
        'border-border z-30 overscroll-contain',
        config().skin,
        config().inlineLayout,
        drawer.open()
          ? 'visible translate-0 opacity-100'
          : ['invisible opacity-0', config().panelClosed],
        dragging()
          ? 'transition-none'
          : 'transition-[opacity,translate,visibility] duration-200 ease-out motion-reduce:transition-none',
        props.class,
      ]}
    >
      {body()}
    </aside>
  )

  return (
    <Show when={drawer.modal()} fallback={panel()}>
      <dialog
        ref={(el) => {
          dialog = el
        }}
        id={props.id}
        aria-label={props.label}
        aria-labelledby={labelledBy()}
        aria-describedby={describedBy()}
        onClose={handleClose}
        onClick={handleClick}
        style={{ translate: translate() }}
        class={[
          'border-border backdrop:bg-foreground/40 m-0 max-w-none overscroll-contain p-0 opacity-0 open:opacity-100 starting:open:opacity-0',
          config().skin,
          config().slide,
          config().modalLayout,
          dragging()
            ? 'transition-none'
            : 'transition-[opacity,translate,overlay,display] transition-discrete duration-200 ease-out motion-reduce:transition-none',
          props.class,
        ]}
      >
        {body()}
      </dialog>
    </Show>
  )
}

export type DrawerButtonProps = Omit<ComponentProps<'button'>, 'onClick'>

export const DrawerTrigger = (props: DrawerButtonProps) => {
  const drawer = useDrawer()
  const rest = omit(props, 'type', 'children')

  return (
    <button
      {...rest}
      type={props.type ?? 'button'}
      aria-expanded={drawer.open() ? 'true' : 'false'}
      onClick={() => drawer.onOpenChange(true)}
    >
      {props.children}
    </button>
  )
}

export const DrawerClose = (props: DrawerButtonProps) => {
  const drawer = useDrawer()
  const rest = omit(props, 'type', 'children')

  return (
    <button {...rest} type={props.type ?? 'button'} onClick={() => drawer.onOpenChange(false)}>
      {props.children}
    </button>
  )
}

export const DrawerHeader = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class', 'children')

  return (
    <div {...rest} class={['flex flex-col gap-1.5 p-4', props.class]}>
      {props.children}
    </div>
  )
}

export const DrawerFooter = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class', 'children')

  return (
    <div {...rest} class={['mt-auto flex flex-col gap-2 p-4', props.class]}>
      {props.children}
    </div>
  )
}

/** Registers a labelling part with the drawer while it is mounted */
const useRegistration = (register: (present: boolean) => void) => {
  onSettled(() => {
    register(true)
    return () => register(false)
  })
}

export const DrawerTitle = (props: ComponentProps<'h2'>) => {
  const drawer = useDrawer()
  const rest = omit(props, 'class', 'children', 'id')
  useRegistration(drawer.setHasTitle)

  return (
    <h2
      {...rest}
      id={drawer.titleId}
      class={['text-foreground font-bold [overflow-wrap:anywhere]', props.class]}
    >
      {props.children}
    </h2>
  )
}

export const DrawerDescription = (props: ComponentProps<'p'>) => {
  const drawer = useDrawer()
  const rest = omit(props, 'class', 'children', 'id')
  useRegistration(drawer.setHasDescription)

  return (
    <p {...rest} id={drawer.descriptionId} class={['text-muted-foreground', props.class]}>
      {props.children}
    </p>
  )
}
