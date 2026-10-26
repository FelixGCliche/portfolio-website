// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { omit } from 'solid-js'

import { cn } from './cn'

export const cardVariants = cva(
  'bg-card text-card-foreground flex flex-col gap-3 border py-[14px]',
  {
    variants: {
      variant: {
        default: 'border-border',
        cta: 'border-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type CardProps = ComponentProps<'div'> & VariantProps<typeof cardVariants>

export const Card = (props: CardProps) => {
  const rest = omit(props, 'class', 'variant')

  return <div {...rest} class={cn(cardVariants({ variant: props.variant }), props.class)} />
}

export const CardHeader = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class')

  return <div {...rest} class={cn('flex flex-col gap-1 px-[18px]', props.class)} />
}

export const CardTitle = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class')

  return <div {...rest} class={cn('text-foreground font-bold', props.class)} />
}

export const CardDescription = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class')

  return <div {...rest} class={cn('text-muted-foreground text-[12px]', props.class)} />
}

export const CardContent = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class')

  return <div {...rest} class={cn('text-secondary-foreground px-[18px]', props.class)} />
}

export const CardFooter = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class')

  return <div {...rest} class={cn('flex items-center gap-2.5 px-[18px]', props.class)} />
}
