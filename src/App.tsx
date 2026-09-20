import { AppShell } from './components/layout/AppShell'
import { TokenPreview } from './components/TokenPreview'

import './App.css'

const App = () => (
  <AppShell>
    <div class="mx-auto w-full px-4 py-4 sm:px-6 lg:px-10 xl:max-w-4xl">
      <TokenPreview />
    </div>
  </AppShell>
)

export default App
