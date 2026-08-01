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

## The actual box (verified 2026-08-01)

Reality has drifted from the fresh-box recipe above. `roadmap.sessio.io` runs on
the **shared** web box `sessio-web` (`91.99.222.209`) next to sessio-operator,
publisher-portal and sessio-org-admin, all fronted by a **Caddy container** on
the docker network `web` - the container publishes **no host port**; Caddy
reaches it by name. Data is mounted from **`/opt/roadmap/data`** (not
`/opt/roadmap-data`), there is **no `/opt/roadmap.env`** (env was passed
directly at `docker run`), and `/home/johannes/roadmap-strategy` is **not a git
clone** - there is no usable checkout of this repo on the box.

## Updating

There is no clone to `git pull` on the box. Ship a source archive from a
machine that has the repo, build on the box, swap the container:

```bash
# From your clone (git pull first - the investor fix is 8f830ee):
git archive --format=tar.gz HEAD | ssh <user>@91.99.222.209 \
  'rm -rf /tmp/rs-build && mkdir -p /tmp/rs-build && tar -xz -C /tmp/rs-build'

# On the box:
cd /tmp/rs-build && sudo docker build -t roadmap-strategy:latest .
# One-time: persist the runtime env out of the old container (never into git):
sudo docker inspect roadmap-strategy \
  --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | grep -E '^(ROADMAP_PASSWORD|ROADMAP_INVESTOR_PASSWORD|NODE_ENV)=' \
  | sudo tee /opt/roadmap.env >/dev/null && sudo chmod 600 /opt/roadmap.env
sudo docker rm -f roadmap-strategy
sudo docker run -d --name roadmap-strategy --restart unless-stopped \
  --network web --env-file /opt/roadmap.env \
  -v /opt/roadmap/data:/app/.data roadmap-strategy:latest
```

Verify: `https://roadmap.sessio.io` still gates to `/login`; log in and check
the changed page. Live edits made in the app persist to `/opt/roadmap/data`
(the mounted volume), so they survive rebuilds.

## Docs sync — RETIRED (2026-08-01)

`scripts/sync-to-docs.sh` (ran on Johannes's Mac as the "roadmap-morning-sync"
daily task) and `scripts/sync-to-docs-box.sh` (systemd timer on the box) used to
regenerate `Sessio-docs/docs/roadmap/site-state/` wholesale from the editor's
`ladder.json` and push straight to `main`. The M-ladder was retired as the live
sequencing model on 2026-07-09; the site-state snapshot in Sessio-docs is now a
frozen historical mirror with a RETIRED banner. A restarted sync would overwrite
that banner and resurrect the stale ladder as if it were current — so the sync
is retired for good, not paused. Both scripts are deleted (git history keeps
them). Last sync commit: 2026-06-24.

The push credential is already dead: Sessio-docs has no deploy keys registered
(verified 2026-08-01), so the box's `~/.ssh/sessio-docs-deploy` key can no
longer push even if the timer fires. And it does still fire: recon on
2026-08-01 found `roadmap-docs-sync.timer` armed and running daily at 07:40 UTC
(last run that morning), failing silently. Box-side sweep, verified names and
paths (run as johannes, with sudo):

```bash
sudo systemctl disable --now roadmap-docs-sync.timer
sudo rm /etc/systemd/system/roadmap-docs-sync.timer /etc/systemd/system/roadmap-docs-sync.service
sudo systemctl daemon-reload
rm -f ~/sync-docs.sh                                            # the box copy of the script
rm -f ~/.ssh/sessio-docs-deploy ~/.ssh/sessio-docs-deploy.pub   # orphaned key
rm -rf ~/Sessio-docs                                            # push clone, unused
```

And on Johannes's Mac: remove the "roadmap-morning-sync" daily task if still
installed (its half last committed 2026-06-22).

## Local development

```bash
pnpm install && pnpm dev      # http://localhost:3002
```

`.env.local` holds the local password; data persists to `.data/*.json`.
