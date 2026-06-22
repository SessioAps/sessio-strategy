#!/usr/bin/env bash
# Box-local daily sync: runs ON the roadmap Hetzner box (data is local here),
# commits the editor-state snapshot to Sessio-docs/docs/roadmap/site-state/ and
# pushes via a repo-scoped deploy key. No Mac involved. Driven by a systemd timer.
set -uo pipefail

DATA="/opt/roadmap/data"
DOCS="/home/johannes/Sessio-docs"
DEST="$DOCS/docs/roadmap/site-state"
export GIT_SSH_COMMAND="ssh -i /home/johannes/.ssh/sessio-docs-deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

[ -d "$DOCS/.git" ] || { echo "no Sessio-docs clone at $DOCS"; exit 1; }
mkdir -p "$DEST"

# 1. Copy the live editor state (local files on this box).
for f in ladder board milestones changes; do
  [ -f "$DATA/$f.json" ] && cp -f "$DATA/$f.json" "$DEST/$f.json"
done

# 2. One-time README.
if [ ! -f "$DEST/README.md" ]; then
  cat > "$DEST/README.md" <<'MD'
# Roadmap — live site state (auto-synced)

Daily one-way snapshot of what the team edits at https://roadmap.sessio.io.
Auto-committed once a day by the roadmap server. A MIRROR of the live editor,
not the canonical roadmap (`../ladder.md` etc. stay grill-governed). Status
here is driven by the per-step checkmarks in the editor.
MD
fi

# 3. Readable status table.
python3 - "$DEST/ladder.json" > "$DEST/STATUS.md" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
def counts(r):
    tot = dn = 0
    for s in r.get("steps") or []:
        for side, dk in (("app", "appDone"), ("portal", "portalDone")):
            t = s.get(side)
            if t and "n/a" not in t.lower() and "vision-only" not in t.lower():
                tot += 1
                if s.get(dk):
                    dn += 1
    return dn, tot
print("# Roadmap — live status\n")
print("_Auto-synced daily from roadmap.sessio.io. Editor snapshot, NOT the canonical ladder.md._\n")
print("| Rung | Name | Status | Steps done |")
print("|---|---|---|---|")
for r in d.get("rungs", []):
    dn, tot = counts(r)
    print(f"| {r.get('id','')} | {r.get('name','')} | {r.get('status','')} | {(str(dn)+'/'+str(tot)) if tot else '—'} |")
PY

# 4. Commit + push only if changed.
cd "$DOCS" || exit 1
git checkout -q main 2>/dev/null || true
git pull -q --ff-only origin main 2>/dev/null || true
git add docs/roadmap/site-state
if git diff --cached --quiet; then
  echo "roadmap site-state: no changes today"
else
  git -c user.name="roadmap-sync" -c user.email="roadmap-sync@sessio.io" \
    commit -q -m "chore(roadmap): daily site-state sync $(date +%F)" \
    -m "Auto-synced editor state from roadmap.sessio.io (box)."
  if git push -q origin main; then echo "roadmap site-state: synced + pushed"; else echo "push failed"; fi
fi
