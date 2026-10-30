// eslint-disable-next-line solid/imports -- solid-js 2.x has no intrinsic-element prop types; the renderer package owns them
import type { ComponentProps } from '@solidjs/web'
import { createContext, createSignal, omit, useContext } from 'solid-js'
import type { Accessor } from 'solid-js'

// The element wrapping the response scroller, between the hero and the composer; overlays portal into it
export const ResponsePaneContext = createContext<Accessor<HTMLElement | undefined>>()

export const useResponsePane = () => useContext(ResponsePaneContext)

export const ResponsePane = (props: ComponentProps<'div'>) => {
  const rest = omit(props, 'class', 'children', 'ref')
  const [pane, setPane] = createSignal<HTMLElement | undefined>(undefined, {
    name: 'responsePane',
  })

  return (
    <ResponsePaneContext value={pane}>
      <div
        {...rest}
        ref={(element) => setPane(element)}
        class={['relative flex min-h-0 flex-1 flex-col', props.class]}
      >
        {props.children}
      </div>
    </ResponsePaneContext>
  )
}
