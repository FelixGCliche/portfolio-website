// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { omit } from 'solid-js'

import { cn } from './cn'

export const badgeVariants = cva(
  'text-label inline-flex w-fit shrink-0 items-center gap-1 border px-2 leading-5 tracking-normal whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-border text-muted-foreground',
        primary: 'border-primary text-primary',
        success: 'border-success text-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

export const Badge = (props: BadgeProps) => {
  const rest = omit(props, 'class', 'variant')

  return <span {...rest} class={cn(badgeVariants({ variant: props.variant }), props.class)} />
}
