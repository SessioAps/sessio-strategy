"use client";

import { useState } from "react";

export default function StagePicker({
  id,
  stage,
  stages,
}: {
  id: string;
  stage: string;
  stages: string[];
}) {
  const [busy, setBusy] = useState(false);

  async function move(next: string) {
    if (next === stage) return;
    setBusy(true);
    const res = await fetch("/api/deals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage: next }),
    }).catch(() => null);
    if (res?.ok) window.location.reload();
    else setBusy(false);
  }

  return (
    <select
      value={stage}
      disabled={busy}
      onChange={(e) => move(e.target.value)}
      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
    >
      {stages.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
