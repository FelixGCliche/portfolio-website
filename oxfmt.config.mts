import { defineConfig } from 'oxfmt'

export default defineConfig({
  ignorePatterns: ['.claude/skills', '.agents/skills'],
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  sortImports: true,
  sortTailwindcss: true,
})
