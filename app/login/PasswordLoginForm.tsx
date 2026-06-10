"use client";

import { useState } from "react";

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-white/25";
const BUTTON =
  "mt-4 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40";

export default function PasswordLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit}>
      <p className="mb-5 text-sm text-muted">Enter the team password to continue.</p>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Team password"
        className={INPUT}
      />
      {error && (
        <p className="mt-2 text-xs text-accent-pink">
          That password didn&apos;t work. Try again.
        </p>
      )}
      <button type="submit" disabled={busy || password.length === 0} className={BUTTON}>
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
