# SYNNOD

**128 voices. One mind.** A shared digital character with no single author. Claim a cell of a pixel brain, speak through it, and watch one mind grow from everyone who talks to it.

Full brief: [`docs/SYNNOD_PROJECT.md`](docs/SYNNOD_PROJECT.md) (Russian).

## What's in here

- **Pixel brain** — a 2.5D cluster of hexagonal prisms rendered on Canvas 2D (`src/lib/brain`, `src/components/brain`), ported from the reference generator in `docs/brain_reference_generator.py`.
- **8-bit UI** — Press Start 2P + VT323, animated pixel-art scenes, themed scrollbars, opening splash with generative lo-fi (Web Audio, no audio files).
- **Backend** (Route Handlers in `src/app/api`, logic in `src/server`) — Postgres via Drizzle, guest nickname or wallet sign-in (EVM `personal_sign`, Solana `signMessage`), node claiming, scenarios with guards + LLM moderation, SSE stream, cron-driven autonomous thoughts.
- **DEMO / LIVE toggle** (header) — DEMO is a clearly labelled simulated feed; LIVE shows only real data from the API.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional; see below
npm run dev                  # http://localhost:3000
```

With no `DATABASE_URL` it uses an embedded Postgres (PGlite) stored in `.data/`, so nothing needs installing. Without `ANTHROPIC_API_KEY` the mind stays quiet: scenarios are saved but no replies or thoughts are invented.

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. **Required on Vercel** (serverless has no persistent disk). |
| `ANTHROPIC_API_KEY` | Enables replies, moderation, summaries and thoughts. |
| `SYNNOD_MODEL` | Model id (default `claude-haiku-4-5-20251001`). |
| `CRON_SECRET` | Bearer secret for `POST /api/cron/thoughts`. |
| `NEXT_PUBLIC_SYNNOD_DEFAULT_DEMO` | `1` = open in simulated DEMO mode by default (showcase deploys without a database). |

## Deploying to Vercel

1. Import the repo in Vercel (framework: Next.js, defaults are fine).
2. For a **showcase** with no database: set `NEXT_PUBLIC_SYNNOD_DEFAULT_DEMO=1`.
3. For **live data**: add a Postgres (Storage → Neon in the Vercel dashboard sets `DATABASE_URL`), optionally `ANTHROPIC_API_KEY` and `CRON_SECRET`, and remove the demo variable.

Known limits on serverless: the SSE stream and rate limiter are per-instance (in-memory). Use Redis pub/sub and a shared limiter before running multiple instances at scale.

## Status

Stage 1 (UI prototype) and Stage 2 (working MVP backend) are done. Not built yet: `$SYNOD` token-gated claiming (blocked on tokenomics, see brief §14), node history pages, TTS, admin/moderation UI.
