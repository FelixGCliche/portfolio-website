import { HydrationScript } from '@solidjs/web'
import type { ParentProps } from 'solid-js'

import { THEME_COLOR_META_ID, THEME_COLORS, THEME_INIT_SCRIPT } from '@features/preferences'

const Document = (props: ParentProps) => (
  <html lang="en" class="dark">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" id={THEME_COLOR_META_ID} content={THEME_COLORS.dark} />
      <link rel="icon" href="/favicon.ico" />
      <title>Félix Gagné Cliche — Software Developer</title>
      {/* oxlint-disable-next-line solid/no-innerhtml -- static constant, no user input */}
      <script innerHTML={THEME_INIT_SCRIPT} />
      <HydrationScript />
    </head>
    <body>{props.children}</body>
  </html>
)

export default Document
