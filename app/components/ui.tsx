import { STATUS_META, type Status } from "@/app/lib/roadmap";

export function StatusPill({ status }: { status?: Status }) {
  if (!status) return null;
  const m = STATUS_META[status];
  return (
    <span className="pill" style={{ color: m.color, backgroundColor: `${m.color}1f` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  );
}

export function DateChip({ date }: { date?: string }) {
  if (!date) return null;
  return (
    <span className="pill border border-border text-muted">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {date}
    </span>
  );
}

export function OwnerChip({ owner }: { owner?: string }) {
  if (!owner) return null;
  const initials = owner
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-[9px] font-semibold text-muted-strong">
        {initials}
      </span>
      {owner}
    </span>
  );
}
