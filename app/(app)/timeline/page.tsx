import { AREAS } from "@/app/lib/roadmap";
import { getMilestones } from "@/app/lib/store";
import { StatusPill } from "@/app/components/ui";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthsBetween(minKey: string, maxKey: string): string[] {
  const [y0, m0] = minKey.split("-").map(Number);
  const [y1, m1] = maxKey.split("-").map(Number);
  const out: string[] = [];
  let y = y0;
  let m = m0;
  while (y < y1 || (y === y1 && m <= m1)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export default async function TimelinePage() {
  const milestones = await getMilestones();
  const sorted = [...milestones].sort((a, b) => a.iso.localeCompare(b.iso));

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-7 border-b border-border pb-6">
        <p className="eyebrow mb-2">Timeline</p>
        <h1 className="text-2xl font-semibold tracking-tight">The road ahead, by date</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Every confirmed launch, showcase, and conference, color-coded by division.
        </p>
      </header>

      {sorted.length === 0 ? (
        <p className="max-w-2xl rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted">
          No dated milestones loaded yet — they live in the private store.
        </p>
      ) : (
        <div className="app-scroll overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4">
            {monthsBetween(sorted[0].iso.slice(0, 7), sorted[sorted.length - 1].iso.slice(0, 7)).map(
              (key) => {
                const [y, m] = key.split("-").map(Number);
                const events = sorted.filter((ev) => ev.iso.slice(0, 7) === key);
                return (
                  <div key={key} className="w-64 shrink-0">
                    <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
                      <span className="text-sm font-semibold">{MONTH_NAMES[m - 1]}</span>
                      <span className="text-[11px] text-muted">{y}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {events.length === 0 && (
                        <div className="px-1 py-4 text-xs text-muted">No events</div>
                      )}
                      {events.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-xl border border-border bg-surface-elevated p-3"
                          style={{ borderLeft: `3px solid ${AREAS[ev.area].color}` }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-muted-strong">
                              {ev.date}
                            </span>
                            <StatusPill status={ev.status} />
                          </div>
                          <div className="mt-1 text-sm font-medium leading-snug">
                            {ev.title}
                          </div>
                          {ev.location && (
                            <div className="mt-0.5 text-[11px] text-muted">{ev.location}</div>
                          )}
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: AREAS[ev.area].color }}
                            />
                            {AREAS[ev.area].label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}
