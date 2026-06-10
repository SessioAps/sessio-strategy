import { STATUS_META, type Card } from "@/app/lib/roadmap";

// Tiny stacked status bar: done (mint) → active (blue) → blocked (pink) →
// planned (grey). Reads progress at a glance without a single number.
export function statusCounts(cards: Card[]) {
  const c = { done: 0, active: 0, blocked: 0, planned: 0 };
  for (const card of cards) {
    const s = card.status ?? "planned";
    c[s] += 1;
  }
  return c;
}

export default function ProgressBar({
  cards,
  showLegend,
}: {
  cards: Card[];
  showLegend?: boolean;
}) {
  const counts = statusCounts(cards);
  const total = cards.length;
  if (total === 0) {
    return <div className="h-1.5 w-full rounded-full bg-surface-2" />;
  }
  const seg = (n: number) => `${(n / total) * 100}%`;

  return (
    <div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div style={{ width: seg(counts.done), backgroundColor: STATUS_META.done.color }} />
        <div style={{ width: seg(counts.active), backgroundColor: STATUS_META.active.color }} />
        <div style={{ width: seg(counts.blocked), backgroundColor: STATUS_META.blocked.color }} />
      </div>
      {showLegend && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
          {(Object.keys(counts) as (keyof typeof counts)[]).map((k) =>
            counts[k] > 0 ? (
              <span key={k} className="inline-flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STATUS_META[k].color }}
                />
                {counts[k]} {STATUS_META[k].label.toLowerCase()}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
