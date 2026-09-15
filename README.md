# Portfolio Website

## Setup

This repository uses [Mise](https://mise.jdx.dev) to manage the dev environment — Node, bun, and lefthook are pinned in `mise.toml`.

1. Install Mise: see the [getting started guide](https://mise.jdx.dev/getting-started.html)
2. Install the pinned tools: `mise install`
3. Install dependencies: `bun install`
4. Start the dev server: `bun run dev`

`bun install` also runs `lefthook install` (via the `prepare` script), wiring up precommit hooks that run typecheck, lint, and format checks.

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
