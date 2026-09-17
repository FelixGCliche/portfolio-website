import { For } from 'solid-js'

import './App.css'

// The app root: a plain content component — the document shell lives in
// src/Document.tsx. This file is the whole demo; replace its contents to
// start your app.

const colorTokens = [
  { name: 'background', bg: 'bg-background', fg: 'text-foreground' },
  { name: 'foreground', bg: 'bg-foreground', fg: 'text-background' },
  { name: 'card', bg: 'bg-card', fg: 'text-card-foreground' },
  { name: 'card-foreground', bg: 'bg-card-foreground', fg: 'text-card' },
  { name: 'popover', bg: 'bg-popover', fg: 'text-popover-foreground' },
  { name: 'popover-foreground', bg: 'bg-popover-foreground', fg: 'text-popover' },
  { name: 'primary', bg: 'bg-primary', fg: 'text-primary-foreground' },
  { name: 'primary-foreground', bg: 'bg-primary-foreground', fg: 'text-primary' },
  { name: 'secondary', bg: 'bg-secondary', fg: 'text-secondary-foreground' },
  { name: 'secondary-foreground', bg: 'bg-secondary-foreground', fg: 'text-secondary' },
  { name: 'muted', bg: 'bg-muted', fg: 'text-muted-foreground' },
  { name: 'muted-foreground', bg: 'bg-muted-foreground', fg: 'text-muted' },
  { name: 'accent', bg: 'bg-accent', fg: 'text-accent-foreground' },
  { name: 'accent-foreground', bg: 'bg-accent-foreground', fg: 'text-accent' },
  { name: 'destructive', bg: 'bg-destructive', fg: 'text-destructive-foreground' },
  { name: 'destructive-foreground', bg: 'bg-destructive-foreground', fg: 'text-destructive' },
]

const outlineTokens = [
  { name: 'border', class: 'border-border' },
  { name: 'input', class: 'border-input' },
  { name: 'ring', class: 'border-ring' },
]

const radiusTokens = [
  { name: 'radius-sm', class: 'rounded-sm' },
  { name: 'radius-md', class: 'rounded-md' },
  { name: 'radius-lg', class: 'rounded-lg' },
  { name: 'radius-xl', class: 'rounded-xl' },
]

const typeScale = [
  { name: 'text-xs', class: 'text-xs' },
  { name: 'text-sm', class: 'text-sm' },
  { name: 'text-base', class: 'text-base' },
  { name: 'text-lg', class: 'text-lg' },
  { name: 'text-xl', class: 'text-xl' },
  { name: 'text-2xl', class: 'text-2xl' },
  { name: 'text-3xl', class: 'text-3xl' },
  { name: 'text-4xl', class: 'text-4xl' },
]

const groteskWeights = [
  { name: '300 normal', class: 'font-grotesk-mono font-light' },
  { name: '400 normal', class: 'font-grotesk-mono font-normal' },
  { name: '400 italic', class: 'font-grotesk-mono font-normal italic' },
  { name: '500 normal', class: 'font-grotesk-mono font-medium' },
  { name: '700 normal', class: 'font-grotesk-mono font-bold' },
  { name: '700 italic', class: 'font-grotesk-mono font-bold italic' },
]

const App = () => {
  return (
    <main class="bg-background text-foreground min-h-screen p-8">
      <h1 class="font-grotesk-mono mb-1 text-3xl font-bold">Design Tokens</h1>
      <p class="text-muted-foreground mb-10">
        Colors, radii, and typography sourced from <code>src/theme.css</code>.
      </p>

      <section class="mb-12">
        <h2 class="mb-4 text-xl font-semibold">Colors</h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <For each={colorTokens}>
            {(token) => (
              <div
                class={`border-border flex h-24 flex-col justify-between rounded-lg border p-3 ${token.bg} ${token.fg}`}
              >
                <span class="font-grotesk-mono text-xs">{token.name}</span>
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="mb-12">
        <h2 class="mb-4 text-xl font-semibold">Outlines</h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <For each={outlineTokens}>
            {(token) => (
              <div
                class={`flex h-16 items-center justify-center rounded-lg border-2 ${token.class}`}
              >
                <span class="font-grotesk-mono text-xs">{token.name}</span>
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="mb-12">
        <h2 class="mb-4 text-xl font-semibold">Radius</h2>
        <div class="flex flex-wrap gap-4">
          <For each={radiusTokens}>
            {(token) => (
              <div
                class={`border-border bg-card flex h-20 w-20 items-center justify-center border-2 text-center ${token.class}`}
              >
                <span class="font-grotesk-mono text-xs">{token.name}</span>
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="mb-12">
        <h2 class="mb-4 text-xl font-semibold">Type scale</h2>
        <div class="flex flex-col gap-2">
          <For each={typeScale}>
            {(step) => (
              <p class={step.class}>{step.name} — The quick brown fox jumps over the lazy dog</p>
            )}
          </For>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-xl font-semibold">PP Right Grotesk Mono</h2>
        <div class="flex flex-col gap-2">
          <For each={groteskWeights}>
            {(weight) => (
              <p class={`${weight.class} text-lg`}>
                {weight.name} — The quick brown fox jumps over the lazy dog
              </p>
            )}
          </For>
        </div>
      </section>
    </main>
  )
}

export default App
