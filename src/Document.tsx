import { HydrationScript } from '@solidjs/web'
import type { ParentProps } from 'solid-js'

const Document = (props: ParentProps) => (
  <html lang="en" class="dark">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#2E3440" />
      <link rel="icon" href="/favicon.ico" />
      <title>Félix Gagné Cliche — Software Developer</title>
      <HydrationScript />
    </head>
    <body>{props.children}</body>
  </html>
)

export default Document
