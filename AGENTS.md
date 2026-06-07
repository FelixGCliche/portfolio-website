# portfolio-solid — AGENTS.md

## Stack

- **Solid.js** + **TypeScript** (strict mode, `jsxImportSource: "solid-js"`, `jsx: "preserve"`)
- **TanStack Router** (file-based, target: `solid`) — routes live in `src/routes/`, route tree auto-generated to `src/routeTree.gen.ts`
- **Tailwind CSS v4** — configured via `@tailwindcss/vite` Vite plugin, **no** `tailwind.config.*` file
- **Vite** dev server on port **3000** (`vite --port 3000`)
- **Deployment**: Cloudflare Workers static assets (`wrangler.jsonc` → `assets.directory: "dist"`)

## Tooling (non-obvious)

| Concern     | Tool                     | Why it matters                                          |
| ----------- | ------------------------ | ------------------------------------------------------- |
| Package mgr | **bun** (not npm/pnpm)   | `bun install`, `bun run <script>`                       |
| Runtime mgr | **mise** (not nvm)       | `mise install` before `bun install`                     |
| Linter      | **oxlint** (not ESLint)  | `bun run check:lint`, `bun run fix:lint`                |
| Formatter   | **oxfmt** (not Prettier) | `bun run check:format`, `bun run fix:format`            |
| Git hooks   | **lefthook**             | Installed by mise postinstall; config in `lefthook.yml` |

## Commands

```sh
# dev
bun run dev                          # vite --port 3000

# check (CI order: lint → format → type)
bun run check:lint                   # oxlint
bun run check:format                 # oxfmt --check
bun run check:type                   # tsc --noEmit

# fix
bun run fix:lint                     # oxlint --fix
bun run fix:format                   # oxfmt

# build & deploy
bun run build                        # vite build → dist/
bun run deploy                       # build + wrangler deploy
bun run preview                      # build + wrangler dev (local preview)
```

**Pre-commit order** (sequential, lefthook): `fix:lint` → `fix:format` → `check:type`

## Code style (oxfmt defaults)

- `singleQuote: true`, `semi: false`, `printWidth: 120`, `trailingComma: "es5"`, `bracketSpacing: true`

## Route codegen

TanStack Router generates `src/routeTree.gen.ts` based on files in `src/routes/`. The generator runs automatically during dev/build via `@tanstack/router-plugin/vite`. **Do not edit `src/routeTree.gen.ts` manually.** The `.tanstack/` directory is gitignored and excluded from lint/format/type-check.

## Testing

**No test framework or test scripts are configured.** There are no tests to run.

## Lint/format exclusions

`dist/*`, `node_modules/*`, `.tanstack/*`, `src/routeTree.gen.ts` are excluded from both oxlint and oxfmt.

## CI

PRs to `main` trigger: checkout → setup (mise + `bun install --frozen-lockfile` + build) → `check:lint` → `check:format` → `check:type`
