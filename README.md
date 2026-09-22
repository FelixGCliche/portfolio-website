# Portfolio Website

## Setup

This repository uses [Mise](https://mise.jdx.dev) to manage the dev environment — Node, bun, and lefthook are pinned in `mise.toml`.

1. Install Mise: see the [getting started guide](https://mise.jdx.dev/getting-started.html)
2. Install the pinned tools: `mise install`
3. Install dependencies: `bun install`
4. Start the dev server: `bun run dev`

`bun install` also runs `lefthook install` (via the `prepare` script), wiring up precommit hooks that run typecheck, lint, and format checks.

## Project Structure

Feature-based layout under `src/`. Folder names describe the feature or domain, never a technical layer (the one exception is `hooks/`, below).

- `assets/` — images, downloadable files, fonts, etc.
- `components/` — reusable component primitives like buttons, popovers, sheets; flat, one file per primitive plus a single `index.ts` barrel
- `features/` — specific business logic and complex components; every distinct feature/domain gets its own subfolder
- `hooks/` — shared, generic hooks; flat, one file per hook plus a single `index.ts` barrel. A deliberate exception to the no-technical-layer rule: shared hooks belong to no single feature. Feature-specific hooks stay inside their feature
- `routes/` — file-based routing shells

Plumbing files stay at the `src/` root: `App.tsx`, `Document.tsx`, `router.tsx`, `routeTree.gen.ts` (generated), `App.css`, `theme.css`.

Cross-folder imports use the path aliases (`@assets`, `@components`, `@features`, `@hooks`, `@routes`); each folder exposes a single `index.ts` barrel as its public API, and imports within a folder stay relative.

## Available Scripts

In the project directory, you can run:

### `bun run dev` or `bun start`

Runs the app in development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `bun run build`

Builds the static production site to `dist/client`.

### `bun run serve`

Serves the production build locally.

### `bun run check`

Runs typecheck, lint, and format check — the same checks enforced by the precommit hook and CI.

- `bun run check:type` / `check:lint` / `check:format` — run a single check
- `bun run fix:lint` / `fix:format` — auto-fix lint or format issues

This project was created with the [Solid CLI](https://github.com/solidjs-community/solid-cli)
