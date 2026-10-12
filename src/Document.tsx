import { HeadContent, Scripts } from '@tanstack/solid-router'
import type { ParentProps } from 'solid-js'

import { DEFAULT_LOCALE, stringsFor, translate } from '@features/i18n'
import {
  DEFAULT_THEME,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  THEME_INIT_SCRIPT,
} from '@features/preferences'

const DEFAULT_STRINGS = stringsFor(DEFAULT_LOCALE)

const Document = (props: ParentProps) => (
  <html lang={DEFAULT_LOCALE} class={DEFAULT_THEME === 'dark' ? 'dark' : undefined}>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" id={THEME_COLOR_META_ID} content={THEME_COLORS[DEFAULT_THEME]} />
      <link rel="icon" href="/favicon.ico" />
      <meta name="description" content={translate(DEFAULT_STRINGS, 'document.description')} />
      <title>{translate(DEFAULT_STRINGS, 'document.title')}</title>
      {/* oxlint-disable-next-line solid/no-innerhtml -- static constant, no user input */}
      <script innerHTML={THEME_INIT_SCRIPT} />
      <HeadContent />
    </head>
    <body>
      {props.children}
      <Scripts />
    </body>
  </html>
)

export default Document
