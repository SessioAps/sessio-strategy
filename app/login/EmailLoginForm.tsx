"use client";

import { useState } from "react";

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-white/25";
const BUTTON =
  "mt-4 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40";

export default function EmailLoginForm({ domain }: { domain: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <div>
        <p className="text-sm font-medium text-foreground">Check your inbox.</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          We sent a one-click sign-in link to{" "}
          <span className="text-muted-strong">{email}</span>. Open it and you&apos;ll
          land back here signed in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <p className="mb-5 text-sm text-muted">
        Sign in with your <span className="text-muted-strong">@{domain}</span>{" "}
        email — we&apos;ll send you a one-click link.
      </p>
      <input
        type="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={`you@${domain}`}
        className={INPUT}
      />
      {error && <p className="mt-2 text-xs text-accent-pink">{error}</p>}
      <button type="submit" disabled={busy || email.length === 0} className={BUTTON}>
        {busy ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}
