import { NextResponse } from "next/server";
import { appendChange, getMilestones, saveMilestones } from "@/app/lib/store";
import type { Status } from "@/app/lib/roadmap";

export const dynamic = "force-dynamic";

type Patch = {
  id: string;
  iso?: string;
  isoEnd?: string | null;
  title?: string;
  status?: Status;
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

// Move / edit a strategy milestone. Calendar-synced items (hello@) are
// read-only here — their source of truth is Outlook.
export async function PUT(request: Request) {
  let patch: Patch;
  try {
    patch = (await request.json()) as Patch;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!patch?.id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  if (patch.iso && !ISO_RE.test(patch.iso)) {
    return NextResponse.json({ error: "bad date" }, { status: 400 });
  }
  if (patch.isoEnd && !ISO_RE.test(patch.isoEnd)) {
    return NextResponse.json({ error: "bad end date" }, { status: 400 });
  }

  const milestones = await getMilestones();
  const idx = milestones.findIndex((m) => m.id === patch.id);
  if (idx === -1) {
    return NextResponse.json(
      { error: "not found (calendar items are read-only)" },
      { status: 404 },
    );
  }

  const before = milestones[idx];
  const next = { ...before };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.iso !== undefined) next.iso = patch.iso;
  if (patch.isoEnd !== undefined) {
    if (patch.isoEnd === null) delete next.isoEnd;
    else next.isoEnd = patch.isoEnd;
  }
  // Keep the human label in step when dates move.
  if (patch.iso !== undefined || patch.isoEnd !== undefined) {
    next.date = humanLabel(next.iso, next.isoEnd);
  }
  milestones[idx] = next;

  try {
    await saveMilestones(milestones);
    await appendChange({
      at: new Date().toISOString(),
      kind: "event",
      summary: `"${before.title}" → ${
        patch.iso ? `moved to ${next.date}` : "edited"
      }${patch.title ? ` (retitled: "${next.title}")` : ""}`,
    });
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, event: next });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function humanLabel(iso: string, isoEnd?: string): string {
  const [, m, d] = iso.split("-").map(Number);
  if (!isoEnd || isoEnd === iso) return `${d} ${MONTHS[m - 1]}`;
  const [, m2, d2] = isoEnd.split("-").map(Number);
  return m === m2 ? `${d}–${d2} ${MONTHS[m - 1]}` : `${d} ${MONTHS[m - 1]} – ${d2} ${MONTHS[m2 - 1]}`;
}
