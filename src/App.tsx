import { For } from 'solid-js'

import { AppShell } from './components/layout/AppShell'

import './App.css'

const lines = Array.from({ length: 200 }, (_, index) => index + 1)

const App = () => (
  <AppShell>
    <div class="px-4 py-4 sm:px-6 lg:px-10">
      <For each={lines}>
        {(line) => (
          <p class="text-muted-foreground py-1 text-sm">
            Line {line} — dummy content for scroll testing
          </p>
        )}
      </For>
    </div>
  </AppShell>
)

export default App
