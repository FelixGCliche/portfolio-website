import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import devtools from 'solid-devtools/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [devtools(), solid(), tailwindcss(), tanstackRouter({ target: 'solid' })],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@routes': path.resolve(__dirname, './src/routes'),
    },
  },
})
