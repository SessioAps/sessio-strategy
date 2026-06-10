"use client";

import { useEffect, useState } from "react";
import { AREAS, type Milestone } from "@/app/lib/roadmap";
import { StatusPill } from "@/app/components/ui";

// ---------------------------------------------------------------------------
// TimeScale — one timeline, five zoom levels.
//   Day    : 7 day columns        (slide ± a week)
//   Week   : 8 week columns       (slide ± 4 weeks)
//   Month  : 12 month columns     (slide ± 6 months)
//   Year   : 4 quarter columns    (slide ± 1 year)
//   5 years: 5 year columns       (slide ± 1 year)
// An event appears in every bucket its date range touches.
// ---------------------------------------------------------------------------

type Zoom = "day" | "week" | "month" | "year" | "years5";

const ZOOMS: { id: Zoom; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "years5", label: "5 years" },
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfQuarter(d: Date): Date {
  return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
}
function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}
function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

type Bucket = { start: Date; end: Date; label: string; sub: string };

function makeBuckets(zoom: Zoom, anchor: Date): Bucket[] {
  if (zoom === "day") {
    const base = startOfDay(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const s = addDays(base, i);
      return {
        start: s,
        end: addDays(s, 1),
        label: `${DAY_NAMES[(s.getDay() + 6) % 7]} ${s.getDate()}`,
        sub: `${MONTHS[s.getMonth()]} ${s.getFullYear()}`,
      };
    });
  }
  if (zoom === "week") {
    const base = startOfWeek(anchor);
    return Array.from({ length: 8 }, (_, i) => {
      const s = addDays(base, i * 7);
      const e = addDays(s, 7);
      const last = addDays(e, -1);
      return {
        start: s,
        end: e,
        label:
          s.getMonth() === last.getMonth()
            ? `${s.getDate()}–${last.getDate()} ${MONTHS[s.getMonth()]}`
            : `${shortDate(s)} – ${shortDate(last)}`,
        sub: `${s.getFullYear()}`,
      };
    });
  }
  if (zoom === "month") {
    const base = startOfMonth(anchor);
    return Array.from({ length: 12 }, (_, i) => {
      const s = addMonths(base, i);
      return {
        start: s,
        end: addMonths(s, 1),
        label: MONTHS[s.getMonth()],
        sub: `${s.getFullYear()}`,
      };
    });
  }
  if (zoom === "year") {
    const base = startOfQuarter(startOfYear(anchor));
    return Array.from({ length: 4 }, (_, i) => {
      const s = addMonths(base, i * 3);
      return {
        start: s,
        end: addMonths(s, 3),
        label: `Q${Math.floor(s.getMonth() / 3) + 1}`,
        sub: `${MONTHS[s.getMonth()]}–${MONTHS[s.getMonth() + 2]} ${s.getFullYear()}`,
      };
    });
  }
  // years5
  const base = startOfYear(anchor);
  return Array.from({ length: 5 }, (_, i) => {
    const s = new Date(base.getFullYear() + i, 0, 1);
    return {
      start: s,
      end: new Date(base.getFullYear() + i + 1, 0, 1),
      label: `${s.getFullYear()}`,
      sub: i === 0 ? "now" : `+${i}y`,
    };
  });
}

function navStep(zoom: Zoom): (d: Date, dir: 1 | -1) => Date {
  switch (zoom) {
    case "day":
      return (d, dir) => addDays(d, 7 * dir);
    case "week":
      return (d, dir) => addDays(d, 28 * dir);
    case "month":
      return (d, dir) => addMonths(d, 6 * dir);
    case "year":
      return (d, dir) => addMonths(d, 12 * dir);
    case "years5":
      return (d, dir) => addMonths(d, 12 * dir);
  }
}

const COL_WIDTH: Record<Zoom, string> = {
  day: "w-48",
  week: "w-52",
  month: "w-52",
  year: "w-72",
  years5: "w-72",
};

export default function TimeScale({
  milestones,
  initialZoom,
}: {
  milestones: Milestone[];
  initialZoom?: Zoom;
}) {
  const [zoom, setZoom] = useState<Zoom>(initialZoom ?? "month");
  // Anchor is set after mount so server + first client render match.
  const [anchor, setAnchor] = useState<Date | null>(null);
  useEffect(() => {
    setAnchor(new Date());
  }, []);

  if (!anchor) {
    return (
      <div className="h-80 animate-pulse rounded-2xl border border-border bg-surface/40" />
    );
  }

  const today = startOfDay(new Date());
  const buckets = makeBuckets(zoom, anchor);
  const step = navStep(zoom);

  const events = milestones
    .map((m) => ({
      m,
      s: parseISO(m.iso),
      e: addDays(parseISO(m.isoEnd ?? m.iso), 1), // exclusive end
    }))
    .sort((a, b) => a.m.iso.localeCompare(b.m.iso));

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground";

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="flex overflow-hidden rounded-lg border border-border">
          {ZOOMS.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setZoom(z.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                zoom === z.id
                  ? "bg-white/[0.09] text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
        <span className="mx-1 h-4 w-px bg-border" />
        <button type="button" aria-label="Earlier" onClick={() => setAnchor(step(anchor, -1))} className={navBtn}>
          ←
        </button>
        <button type="button" aria-label="Later" onClick={() => setAnchor(step(anchor, 1))} className={navBtn}>
          →
        </button>
        <button
          type="button"
          onClick={() => setAnchor(new Date())}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-foreground"
        >
          Today
        </button>
      </div>

      {/* Columns */}
      <div className="app-scroll overflow-x-auto pb-3">
        <div className="flex min-w-max gap-3">
          {buckets.map((b, i) => {
            const isNow = today >= b.start && today < b.end;
            const isPast = b.end <= today;
            const inBucket = events.filter((ev) => ev.s < b.end && ev.e > b.start);
            return (
              <div key={i} className={`${COL_WIDTH[zoom]} shrink-0 ${isPast ? "opacity-60" : ""}`}>
                <div
                  className={`mb-2.5 flex items-baseline justify-between rounded-lg border px-3 py-2 ${
                    isNow ? "border-white/25 bg-white/[0.06]" : "border-border bg-surface/40"
                  }`}
                >
                  <span className="text-sm font-semibold">{b.label}</span>
                  <span className="text-[10px] text-muted">{isNow ? "● now" : b.sub}</span>
                </div>
                <div className="flex min-h-[140px] flex-col gap-2">
                  {inBucket.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 py-4 text-center text-[11px] text-muted/60">
                      —
                    </div>
                  ) : (
                    inBucket.map((ev) => (
                      <div
                        key={ev.m.id}
                        className="rounded-lg border border-border bg-surface-elevated p-2.5"
                        style={{ borderLeft: `3px solid ${AREAS[ev.m.area].color}` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] font-medium text-muted-strong">
                            {ev.m.date}
                          </span>
                          <StatusPill status={ev.m.status} />
                        </div>
                        <div className="mt-0.5 text-[12.5px] font-medium leading-snug">
                          {ev.m.title}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: AREAS[ev.m.area].color }}
                          />
                          {ev.m.source === "calendar" ? "📅 hello@" : AREAS[ev.m.area].short}
                          {ev.m.location && <span className="truncate">· {ev.m.location}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        Zoom from day to 5 years. Multi-day events appear in every bucket they touch.
      </p>
    </div>
  );
}
