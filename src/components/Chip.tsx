// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { omit } from 'solid-js'

import { cn } from './cn'

export const chipVariants = cva(
  'focus-ring inline-flex cursor-pointer items-center border whitespace-nowrap transition-[color,background-color,border-color] motion-reduce:transition-none',
  {
    variants: {
      variant: {
        full: 'border-border text-foreground hover:border-primary hover:text-primary hover:bg-muted',
        muted: 'border-border text-muted-foreground hover:border-primary hover:text-primary',
        quiet: 'text-muted-foreground hover:text-primary border-transparent',
      },
      size: {
        default: 'min-h-11 px-[15px] text-[12.5px]',
        slim: 'px-[10px] py-1 text-[11.5px] md:px-[11px]',
      },
    },
    defaultVariants: {
      variant: 'full',
      size: 'default',
    },
  }
)

export type ChipVariantProps = VariantProps<typeof chipVariants>

export type ChipProps = ComponentProps<'button'> & ChipVariantProps

export const Chip = (props: ChipProps) => {
  const rest = omit(props, 'class', 'variant', 'size')

  return (
    <button
      type="button"
      {...rest}
      class={cn(chipVariants({ variant: props.variant, size: props.size }), props.class)}
    />
  )
}

export type ChipLinkProps = ComponentProps<'a'> & ChipVariantProps

export const ChipLink = (props: ChipLinkProps) => {
  const rest = omit(props, 'class', 'variant', 'size')

  return (
    <a
      {...rest}
      class={cn(chipVariants({ variant: props.variant, size: props.size }), props.class)}
    />
  )
}
