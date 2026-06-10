// ---------------------------------------------------------------------------
// Horizon engine. Merges undated board cards and dated events (milestones +
// the hello@sessio calendar) into one journey from today to the 5-year vision,
// bucketed by time horizon so a page can jump from "tomorrow" to "vision".
// ---------------------------------------------------------------------------

import type { Card, Milestone } from "@/app/lib/roadmap";

export type HorizonId =
  | "inflight"
  | "tomorrow"
  | "week"
  | "month"
  | "next"
  | "quarter"
  | "year"
  | "beyond"
  | "vision";

export type HorizonMeta = {
  id: HorizonId;
  label: string;
  sub: string;
};

export const HORIZONS: HorizonMeta[] = [
  { id: "inflight", label: "In flight", sub: "Being worked on right now" },
  { id: "tomorrow", label: "Today & tomorrow", sub: "The next 48 hours" },
  { id: "week", label: "This week", sub: "The next 7 days" },
  { id: "month", label: "This month", sub: "Within ~30 days" },
  { id: "next", label: "Next up", sub: "Queued — not yet dated" },
  { id: "quarter", label: "This quarter", sub: "Within ~3 months" },
  { id: "year", label: "This year", sub: "Within 12 months" },
  { id: "beyond", label: "Beyond", sub: "Next year and after" },
  { id: "vision", label: "The vision", sub: "Where this ends up · 5 years" },
];

export type JourneyItem =
  | { kind: "card"; card: Card }
  | { kind: "event"; event: Milestone };

export type Journey = Record<HorizonId, JourneyItem[]>;

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function emptyJourney(): Journey {
  return {
    inflight: [],
    tomorrow: [],
    week: [],
    month: [],
    next: [],
    quarter: [],
    year: [],
    beyond: [],
    vision: [],
  };
}

/**
 * Bucket dated events by distance from today, and undated cards by their
 * board column (now → in flight, next → next up, later → beyond).
 * Past events are dropped (history lives on the timeline).
 */
export function buildJourney(
  today: Date,
  events: Milestone[],
  cards: { now: Card[]; next: Card[]; later: Card[] },
): Journey {
  const j = emptyJourney();
  const t0 = new Date(today);
  t0.setHours(0, 0, 0, 0);

  const d2 = addDays(t0, 2);
  const d7 = addDays(t0, 7);
  const d31 = addDays(t0, 31);
  const d92 = addDays(t0, 92);
  const d365 = addDays(t0, 365);

  j.inflight = cards.now.map((card) => ({ kind: "card", card }));
  j.next = cards.next.map((card) => ({ kind: "card", card }));

  const sorted = [...events].sort((a, b) => a.iso.localeCompare(b.iso));
  for (const event of sorted) {
    const start = parseISO(event.iso);
    const end = event.isoEnd ? parseISO(event.isoEnd) : start;
    if (end < t0) continue; // past — timeline's job
    const item: JourneyItem = { kind: "event", event };
    if (start < d2) j.tomorrow.push(item);
    else if (start < d7) j.week.push(item);
    else if (start < d31) j.month.push(item);
    else if (start < d92) j.quarter.push(item);
    else if (start < d365) j.year.push(item);
    else j.beyond.push(item);
  }

  // Undated long-term cards close the journey just before the vision.
  j.beyond.push(...cards.later.map((card) => ({ kind: "card" as const, card })));

  return j;
}
