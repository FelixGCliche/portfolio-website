// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { omit } from 'solid-js'

import { cn } from './cn'

export const Kbd = (props: ComponentProps<'kbd'>) => {
  const rest = omit(props, 'class')

  return (
    <kbd
      {...rest}
      class={cn(
        'text-foreground inline-flex w-fit items-center font-[inherit] select-none',
        props.class
      )}
    />
  )
}

export const KbdGroup = (props: ComponentProps<'kbd'>) => {
  const rest = omit(props, 'class')

  return <kbd {...rest} class={cn('inline-flex items-center gap-1', props.class)} />
}
