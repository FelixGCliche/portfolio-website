import { cloudflare } from '@cloudflare/vite-plugin'
import solid from '@solidjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/solid-start/plugin/vite'
import { build as buildContent } from 'velite'
import { defineConfig } from 'vite'

// The config is evaluated several times per process; share one content build so concurrent
// `clean` runs don't wipe .velite while another run (or the bundler) is reading it.
const contentBuild = globalThis as { __veliteBuild?: Promise<unknown> }

export default defineConfig(async ({ command, isPreview }) => {
  if (!isPreview) {
    contentBuild.__veliteBuild ??= buildContent({
      watch: command === 'serve',
      clean: command === 'build',
    })
    await contentBuild.__veliteBuild
  }

  return {
    plugins: [
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tailwindcss(),
      tanstackStart(), // must come before solid(); code-splits routes by default
      solid({ ssr: true, diagnostics: true }),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 3000,
    },
    build: {
      target: 'esnext',
      assetsInlineLimit: 0,
    },
  }
})
