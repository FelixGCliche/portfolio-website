import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import devtools from 'solid-devtools/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [devtools(), solid(), tailwindcss(), tanstackRouter({ target: 'solid' })],
})
