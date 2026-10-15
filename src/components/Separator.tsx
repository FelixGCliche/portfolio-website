// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { omit } from 'solid-js'

import { cn } from './cn'

export type SeparatorProps = ComponentProps<'div'> & {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

export const Separator = (props: SeparatorProps) => {
  const rest = omit(props, 'class', 'orientation', 'decorative')
  const orientation = () => props.orientation ?? 'horizontal'
  const decorative = () => props.decorative ?? true

  return (
    <div
      {...rest}
      role={decorative() ? 'none' : 'separator'}
      aria-orientation={!decorative() && orientation() === 'vertical' ? 'vertical' : undefined}
      data-orientation={orientation()}
      class={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        props.class
      )}
    />
  )
}
