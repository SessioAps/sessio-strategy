#!/usr/bin/env bash
# Daily one-way sync of the LIVE roadmap-editor state into Sessio-docs.
#
# Pulls the editor's data off the Hetzner box and commits a snapshot under
# docs/roadmap/site-state/ (ladder/board/milestones/changes + a readable
# STATUS.md). It deliberately does NOT touch Mattis's canonical files
# (ladder.md / ladder.json / app-portal-parity.md) — those stay grill-governed.
# Run by the roadmap-morning-sync daily task; safe to run by hand.
set -uo pipefail

BOX="johannes@91.99.222.209"
DOCS="/Users/johannesmaier/work/Sessio-docs"
DEST="$DOCS/docs/roadmap/site-state"
SSHOPT="-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"

mkdir -p "$DEST"

# 1. Pull the live editor state from the box.
for f in ladder board milestones changes; do
  scp $SSHOPT "$BOX:/opt/roadmap/data/$f.json" "$DEST/$f.json" || { echo "scp $f failed"; exit 1; }
done

# 2. One-time README so the folder explains itself.
if [ ! -f "$DEST/README.md" ]; then
  cat > "$DEST/README.md" <<'MD'
# Roadmap — live site state (auto-synced)

Daily one-way snapshot of what the team edits at https://roadmap.sessio.io
(the editable M-ladder + board). Auto-committed once a day.

This is a MIRROR of the live editor, **not** the canonical roadmap. The
hand-authored source of truth stays in `../ladder.md`, `../ladder.json` and
`../app-portal-parity.md` (changed via /sessio-grill). Status here is driven by
the per-step checkmarks in the editor.
MD
fi

# 3. Readable status table (checkmark-driven).
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

# 4. Commit + push only if something changed.
cd "$DOCS" || exit 1
git checkout -q main 2>/dev/null || true
git pull -q --ff-only origin main 2>/dev/null || true
git add docs/roadmap/site-state
if git diff --cached --quiet; then
  echo "roadmap site-state: no changes today"
else
  git commit -q -m "chore(roadmap): daily site-state sync $(date +%F)" \
    -m "Auto-synced editor state (statuses/checkmarks/moves) from roadmap.sessio.io."
  if git push -q origin main; then echo "roadmap site-state: synced + pushed"; else echo "push failed"; fi
fi
