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

## Agent

The site includes a chat agent that answers questions about the portfolio. The UI posts the conversation to `POST /api/chat`, a TanStack Start server route running on Cloudflare Workers (`src/routes/api/chat.ts`). The route validates the request, then streams a reply from [OpenRouter](https://openrouter.ai) through `@tanstack/ai` (`src/features/agent/`). The agent is grounded in the portfolio content and has UI tools for changing topic, theme, and language.

- Primary model: `google/gemma-4-31b-it:free`
- Fallbacks, tried in order by OpenRouter: `nvidia/nemotron-3-super-120b-a12b:free`, `google/gemma-4-26b-a4b-it:free`
- Limits per request: 5 model turns (tool round-trips included), 1024 completion tokens per turn, 64 KiB body, 40 messages, 2000 characters per user message

### Local setup

1. Copy `.dev.vars.example` to `.dev.vars` (git-ignored)
2. Set `OPENROUTER_API_KEY` in `.dev.vars` (create a key at [openrouter.ai/keys](https://openrouter.ai/keys))
3. Run `bun run dev`

Without a key, `/api/chat` returns a `missing_api_key` error.

### Deploy

1. Store the key as a Worker secret: `bunx wrangler secret put OPENROUTER_API_KEY`
2. Build: `bun run build`
3. Deploy: `bunx wrangler deploy`

The Worker is named `portfolio-website` (see `wrangler.jsonc`).

### Tests

- `bun test` runs the unit tests
- `bun run check` runs typecheck, lint, and format check

### Known limitations

- Free OpenRouter models are rate limited; busy periods can cause slow or failed replies even with fallbacks
- Tool calling quality varies between models, so UI tools may occasionally be skipped or misused
