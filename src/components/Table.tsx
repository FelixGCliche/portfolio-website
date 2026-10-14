// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { omit } from 'solid-js'

import { cn } from './cn'

export const Table = (props: ComponentProps<'table'>) => {
  const rest = omit(props, 'class')

  return (
    <div class="relative w-full overflow-x-auto">
      <table {...rest} class={cn('w-full caption-bottom border-collapse text-left', props.class)} />
    </div>
  )
}

export const TableHeader = (props: ComponentProps<'thead'>) => {
  const rest = omit(props, 'class')

  return <thead {...rest} class={cn('[&_tr]:border-b', props.class)} />
}

export const TableBody = (props: ComponentProps<'tbody'>) => {
  const rest = omit(props, 'class')

  return <tbody {...rest} class={cn('[&_tr:last-child]:border-0', props.class)} />
}

export const TableFooter = (props: ComponentProps<'tfoot'>) => {
  const rest = omit(props, 'class')

  return (
    <tfoot
      {...rest}
      class={cn('border-border bg-muted border-t font-bold [&>tr]:last:border-b-0', props.class)}
    />
  )
}

export const TableRow = (props: ComponentProps<'tr'>) => {
  const rest = omit(props, 'class')

  return <tr {...rest} class={cn('border-border border-b', props.class)} />
}

export const TableHead = (props: ComponentProps<'th'>) => {
  const rest = omit(props, 'class')

  return (
    <th
      {...rest}
      class={cn(
        'text-muted-foreground text-label px-3 py-2 align-middle font-bold whitespace-nowrap uppercase',
        props.class
      )}
    />
  )
}

export const TableCell = (props: ComponentProps<'td'>) => {
  const rest = omit(props, 'class')

  return <td {...rest} class={cn('px-3 py-2 align-baseline', props.class)} />
}

export const TableCaption = (props: ComponentProps<'caption'>) => {
  const rest = omit(props, 'class')

  return <caption {...rest} class={cn('text-muted-foreground mt-3 text-[12px]', props.class)} />
}
