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

With no `DATABASE_URL` it uses an embedded Postgres (PGlite) stored in `.data/`, so nothing needs installing. Without an LLM key the mind stays quiet: scenarios are saved but no replies or thoughts are invented.

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. **Required on Vercel** (serverless has no persistent disk). |
| `LLM_API_KEY`, `LLM_PROVIDER` | Free-tier LLM, no credit card: `gemini` (default), `groq` or `openrouter`. Any OpenAI-compatible API works with `LLM_PROVIDER=openai` + `LLM_BASE_URL` + `LLM_MODEL`. |
| `LLM_MODEL` | Override the preset model (free model names change over time). |
| `ANTHROPIC_API_KEY` | Alternative: Anthropic (paid). |
| `CRON_SECRET` | Bearer secret for `POST /api/cron/thoughts`. |
| `NEXT_PUBLIC_SYNOD_TOKEN_ADDRESS` | ERC-20 a wallet must hold to claim a node. Empty = claiming is free. |
| `NEXT_PUBLIC_SYNOD_CHAIN`, `..._TOKEN_SYMBOL`, `..._TOKEN_DECIMALS`, `..._MIN_HOLD`, `..._TOKEN_FAUCET` | Chain (`testnet` 46630 / `mainnet` 4663), token metadata, required balance, and whether the test faucet button is shown. |
| `SYNOD_RPC_URL` | Override the public Robinhood Chain RPC. |
| `NEXT_PUBLIC_SYNNOD_DEFAULT_DEMO` | `1` = open in simulated DEMO mode by default (showcase deploys without a database). |

## Robinhood Chain token gating

Claiming can require holding a token on [Robinhood Chain](https://docs.robinhood.com/chain/connecting) (an Arbitrum L2, ETH gas). The server reads `balanceOf` on-chain at claim time, using only the standard ERC-20 interface.

```bash
npm run contract:build    # compile contracts/SynodTest.sol -> src/lib/synodTestArtifact.ts
npm run contract:deploy   # deploy tSYNOD (test token with a public faucet) to the testnet
```

`contract:deploy` needs a little testnet ETH for gas: it prints its throw-away deployer address (key in `.data/deployer.key`, gitignored), you fund it from the [testnet faucet](https://faucet.testnet.chain.robinhood.com), then run it again. It prints the env vars to set.

**Swapping in the real launchpad token:** set `NEXT_PUBLIC_SYNOD_TOKEN_ADDRESS` (and symbol/decimals) to the new contract, remove `NEXT_PUBLIC_SYNOD_TOKEN_FAUCET`, redeploy. No code changes. The model is "hold N tokens"; "burn to claim" would need a small addition (the test contract already has `burn`).
## Deploying to Vercel

1. Import the repo in Vercel (framework: Next.js, defaults are fine).
2. For a **showcase** with no database: set `NEXT_PUBLIC_SYNNOD_DEFAULT_DEMO=1`.
3. For **live data**: add a Postgres (Storage → Neon in the Vercel dashboard sets `DATABASE_URL`), an LLM key (`LLM_API_KEY`) and optionally `CRON_SECRET`, and remove the demo variable.

Known limits on serverless: the SSE stream and rate limiter are per-instance (in-memory). Use Redis pub/sub and a shared limiter before running multiple instances at scale.

## Status

Stage 1 (UI prototype) and Stage 2 (working MVP backend) are done. Token-gated claiming is built for the Robinhood Chain testnet with a test token; the real token address plugs in via env (tokenomics still open, brief §14). Not built yet: node history pages, TTS, admin/moderation UI.
