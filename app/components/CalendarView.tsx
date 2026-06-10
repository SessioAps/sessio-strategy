"use client";

import { useEffect, useState } from "react";
import { AREAS, type Milestone } from "@/app/lib/roadmap";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - dow);
  return d;
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function rangeLabel(ws: Date): string {
  const we = addDays(ws, 6);
  const sM = ws.toLocaleString("en-US", { month: "short" });
  const eM = we.toLocaleString("en-US", { month: "short" });
  const y = we.getFullYear();
  return sM === eM
    ? `${sM} ${ws.getDate()} – ${we.getDate()}, ${y}`
    : `${sM} ${ws.getDate()} – ${eM} ${we.getDate()}, ${y}`;
}

export default function CalendarView({ milestones }: { milestones: Milestone[] }) {
  // Compute "today" only after mount so server + first client render match.
  const [anchor, setAnchor] = useState<Date | null>(null);
  useEffect(() => {
    setAnchor(new Date());
  }, []);

  if (!anchor) {
    return (
      <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface/40" />
    );
  }

  const weekStart = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ws = weekStart.getTime();
  const weExclusive = addDays(weekStart, 7).getTime();

  const events = milestones.map((m) => {
    const s = parseISO(m.iso);
    const e = m.isoEnd ? parseISO(m.isoEnd) : s;
    return { m, s, e };
  })
    .filter(({ s, e }) => e.getTime() >= ws && s.getTime() < weExclusive)
    .map(({ m, s, e }) => ({
      m,
      startIdx: Math.max(0, Math.round((s.getTime() - ws) / 86400000)),
      endIdx: Math.min(6, Math.round((e.getTime() - ws) / 86400000)),
    }))
    .sort((a, b) => a.startIdx - b.startIdx || a.m.iso.localeCompare(b.m.iso));

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground";

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() => setAnchor(addDays(weekStart, -7))}
          className={navBtn}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Next week"
          onClick={() => setAnchor(addDays(weekStart, 7))}
          className={navBtn}
        >
          →
        </button>
        <span className="ml-1 text-base font-semibold tracking-tight">
          {rangeLabel(weekStart)}
        </span>
        <button
          type="button"
          onClick={() => setAnchor(new Date())}
          className="ml-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground"
        >
          Today
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-7 border-b border-border">
          {days.map((d, i) => {
            const isToday = sameDay(d, today);
            return (
              <div
                key={i}
                className={`border-r border-border px-3 py-2.5 last:border-r-0 ${
                  isToday ? "bg-white/[0.05]" : "bg-surface/40"
                }`}
              >
                <div className="text-[11px] text-muted">{DAY_NAMES[i]}</div>
                <div
                  className={`text-sm font-semibold ${
                    isToday ? "text-foreground" : "text-muted-strong"
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="grid grid-cols-7 gap-1.5 p-2"
          style={{ gridAutoRows: "min-content", minHeight: "180px" }}
        >
          {events.length === 0 ? (
            <div className="col-span-7 flex h-40 items-center justify-center text-sm text-muted">
              Nothing scheduled this week.
            </div>
          ) : (
            events.map((ev, i) => {
              const color = AREAS[ev.m.area].color;
              const multi = ev.endIdx > ev.startIdx;
              return (
                <div
                  key={ev.m.id}
                  style={{
                    gridColumn: `${ev.startIdx + 1} / ${ev.endIdx + 2}`,
                    gridRow: i + 1,
                    borderLeft: `3px solid ${color}`,
                  }}
                  className="min-w-0 rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-medium">
                      {ev.m.title}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                    <span>{ev.m.date}</span>
                    {ev.m.location && <span className="truncate">· {ev.m.location}</span>}
                    {multi && (
                      <span
                        className="ml-auto rounded px-1 text-[9px] font-medium"
                        style={{ color, backgroundColor: `${color}1f` }}
                      >
                        multi-day
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Strategic events &amp; milestones. Slide with ← → or jump back with Today.
      </p>
    </div>
  );
}
