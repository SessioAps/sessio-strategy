"use client";

import { useState } from "react";

const I = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-white/25 outline-none";

export default function AddContact() {
  const [f, setF] = useState({ name: "", org: "", role: "", email: "", note: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    }).catch(() => null);
    if (res?.ok) window.location.reload();
    else setBusy(false);
  }

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-2xl border border-border bg-surface/40 p-4 sm:grid-cols-[1fr_1fr_1fr_1fr_1.5fr_auto]">
      <input className={I} placeholder="Name" value={f.name} onChange={set("name")} />
      <input className={I} placeholder="Organisation" value={f.org} onChange={set("org")} />
      <input className={I} placeholder="Role" value={f.role} onChange={set("role")} />
      <input className={I} placeholder="Email" value={f.email} onChange={set("email")} />
      <input className={I} placeholder="Note" value={f.note} onChange={set("note")} />
      <button type="submit" disabled={busy || !f.name.trim()} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40">
        {busy ? "…" : "Add"}
      </button>
    </form>
  );
}
