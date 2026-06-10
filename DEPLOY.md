# Deploying the Sessio roadmap

The app is a standard Next.js site. It needs two things in production:

1. **A team password** — env var `ROADMAP_PASSWORD`. The site fails closed without it.
2. **A shared store** — a Vercel KV / Upstash Redis database, so everyone sees
   the same board. Without it, the app falls back to a local file (fine for dev,
   not shared).

## One-time setup on Vercel

1. **Import the repo**: vercel.com → Add New → Project → import `sessio-roadmap`
   from GitHub.
2. **Set the password**: in the import screen, open *Environment Variables* and
   add `ROADMAP_PASSWORD` = your chosen team password. Click **Deploy**.
3. **Add the shared store**: in the project, go to **Storage** → Create Database
   → **Upstash for Redis** (KV) → connect it to this project. That injects the
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`) vars
   automatically.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the store env vars take effect.

That's it. Visit the URL, enter the team password, and the board is live and shared.

## Local development

```bash
pnpm install
pnpm dev            # http://localhost:3002 (via launch.json) or :3000
```

`.env.local` holds the local password; with no KV vars set, the board persists
to `.data/board.json`.

## How Claude updates the board

Content lives in `app/lib/roadmap.ts` (the seed) for first load. Once deployed,
the live board lives in KV; Claude updates it by reading and writing the same
`sessio:roadmap:board` key (fetch-modify-write so team drags aren't clobbered).
