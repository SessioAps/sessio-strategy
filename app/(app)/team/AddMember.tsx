"use client";

import { useState } from "react";

const I = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/25";

export default function AddMember() {
  const [f, setF] = useState({ name: "", role: "", email: "", linkedin: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    }).catch(() => null);
    if (res?.ok) window.location.reload();
    else setBusy(false);
  }

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-2xl border border-border bg-surface/40 p-4 sm:grid-cols-[1.2fr_1fr_1.2fr_1fr_auto]">
      <input className={I} placeholder="Name" value={f.name} onChange={set("name")} />
      <input className={I} placeholder="Role" value={f.role} onChange={set("role")} />
      <input className={I} placeholder="Email" value={f.email} onChange={set("email")} />
      <input className={I} placeholder="LinkedIn (optional)" value={f.linkedin} onChange={set("linkedin")} />
      <button type="submit" disabled={busy || !f.name.trim()} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40">
        {busy ? "…" : "Add"}
      </button>
    </form>
  );
}
