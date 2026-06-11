"use client";

import { useState } from "react";

const I = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/25";
const TAGS = ["Team", "Product", "Traction", "Fundraise", "Partnership"];

export default function PostUpdate() {
  const [f, setF] = useState({ title: "", body: "", tag: "Product" });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/investor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    }).catch(() => null);
    if (res?.ok) window.location.reload();
    else setBusy(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-strong hover:text-foreground"
      >
        + Post an update
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-2xl border border-border bg-surface/50 p-4">
      <div className="flex gap-2">
        <input className={I} placeholder="Headline" value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} autoFocus />
        <select className={`${I} w-40`} value={f.tag} onChange={(e) => setF((p) => ({ ...p, tag: e.target.value }))}>
          {TAGS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <textarea className={`${I} min-h-[80px] resize-y`} placeholder="What happened, and why it matters." value={f.body} onChange={(e) => setF((p) => ({ ...p, body: e.target.value }))} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !f.title.trim()} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40">
          {busy ? "Posting…" : "Post to investors"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted">Cancel</button>
      </div>
    </form>
  );
}
