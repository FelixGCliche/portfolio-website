// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { omit } from 'solid-js'

import { cn } from './cn'

export const buttonVariants = cva(
  'focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap transition-[color,background-color,border-color,opacity] motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground font-bold hover:opacity-80',
        outline:
          'border-border text-foreground hover:border-primary hover:text-primary border bg-transparent',
        ghost: 'text-foreground hover:bg-muted hover:text-primary bg-transparent',
        link: 'text-primary underline underline-offset-4 hover:opacity-80',
      },
      size: {
        default: 'min-h-12 px-[22px] text-[14px]',
        sm: 'min-h-11 px-4 text-[12.5px]',
        icon: 'size-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

export type ButtonProps = ComponentProps<'button'> & ButtonVariantProps

export const Button = (props: ButtonProps) => {
  const rest = omit(props, 'class', 'variant', 'size')

  return (
    <button
      type="button"
      {...rest}
      class={cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)}
    />
  )
}

export type ButtonLinkProps = ComponentProps<'a'> & ButtonVariantProps

export const ButtonLink = (props: ButtonLinkProps) => {
  const rest = omit(props, 'class', 'variant', 'size')

  return (
    <a
      {...rest}
      class={cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)}
    />
  )
}
