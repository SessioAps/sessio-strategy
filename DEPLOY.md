# Deploying Sessio Strategy (dedicated Hetzner box)

A standard Next.js (standalone) app. **No external database.** It needs two things
at runtime, both provided to the container — never baked into the image or repo:

1. **Team password** — env var `ROADMAP_PASSWORD` (the site fails closed without it).
   Ask Johannes for the value; keep it out of the repo.
2. **Data** — three JSON files (`board.json`, `ladder.json`, `milestones.json`)
   mounted at `/app/.data`. This is the private roadmap content; it lives only on
   the box, never in git.

## Prereqs on the box

- Docker
- A reverse proxy terminating TLS. On a fresh box **Caddy** is simplest (automatic
  Let's Encrypt). Use your usual stack if you prefer (nginx / Traefik / kamal-proxy).

## Steps

```bash
# 1. Clone + build
git clone git@github.com:SessioAps/sessio-strategy.git ~/roadmap-strategy
cd ~/roadmap-strategy
docker build -t roadmap-strategy:latest .

# 2. Data dir (the 3 private JSON files go here — see "Getting the data" below)
mkdir -p /opt/roadmap-data
#   copy board.json, ladder.json, milestones.json into /opt/roadmap-data

# 3. Secrets (keep the password out of shell history)
cat > /opt/roadmap.env <<'EOF'
ROADMAP_PASSWORD=__ASK_JOHANNES__
NODE_ENV=production
EOF
chmod 600 /opt/roadmap.env

# 4. Run — bound to localhost; the reverse proxy fronts it
docker run -d --name roadmap-strategy --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file /opt/roadmap.env \
  -v /opt/roadmap-data:/app/.data \
  roadmap-strategy:latest
```

```caddy
# 5. /etc/caddy/Caddyfile  (then: systemctl reload caddy)
roadmap.sessio.io {
    reverse_proxy 127.0.0.1:3000
}
```

6. **DNS** (Johannes): A record `roadmap.sessio.io` → the new box's IP.

Visit `https://roadmap.sessio.io`, enter the team password, done.

## Getting the data

The three JSON files are private and not in the repo. They're currently staged at
`johannes@178.105.199.80:~/roadmap-data/` (board / ladder / milestones) — `scp`
them to `/opt/roadmap-data` on the new box. (Or Johannes can hand them over from
his Mac at `sessio-roadmap/.data/`.)

## Updating

```bash
cd ~/roadmap-strategy && git pull
docker build -t roadmap-strategy:latest .
docker rm -f roadmap-strategy
# re-run the `docker run …` from step 4
```

Live edits made in the app persist to `/opt/roadmap-data` (the mounted volume), so
they survive rebuilds. `git pull` only updates code, not the data volume.

## Local development

```bash
pnpm install && pnpm dev      # http://localhost:3002
```

`.env.local` holds the local password; data persists to `.data/*.json`.
