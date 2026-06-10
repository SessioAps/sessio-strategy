import Link from "next/link";
import { getBoard, getMilestones } from "@/app/lib/store";
import {
  AREA_ORDER,
  AREAS,
  TIMES,
  cellId,
  type Area,
} from "@/app/lib/roadmap";
import { DateChip } from "@/app/components/ui";

export const dynamic = "force-dynamic";

// NOTE: mission / vision / pillars copy below is a draft — replace with the
// exact wording from the pitch deck.
const MISSION =
  "Give music creators and the people around them the tools to make great work together.";
const VISION =
  "Become the home base for how the music industry runs sessions and camps — and the community that forms around them.";

const PILLARS = [
  {
    title: "Product",
    body: "The platform creators and publishers actually use to run sessions, camps, and releases.",
    area: "development" as Area,
  },
  {
    title: "Community",
    body: "Events and a creator community that compound — Denmark first, then the Nordics.",
    area: "events" as Area,
  },
  {
    title: "Industry",
    body: "Publisher and label portals as the wedge into how the business already works.",
    area: "strategy" as Area,
  },
  {
    title: "Foundation",
    body: "The team and the capital to sustain the climb, with a healthy runway.",
    area: "financials" as Area,
  },
];

export default async function VisionPage() {
  const [board, milestones] = await Promise.all([getBoard(), getMilestones()]);
  const divisions = AREA_ORDER.filter((a) => a !== "milestones");

  const count = (area: Area) =>
    TIMES.reduce((n, t) => n + (board[cellId(area, t)]?.length ?? 0), 0);

  const upcoming = milestones.filter((m) => m.status !== "done").slice(0, 5);

  return (
    <div className="px-6 py-10 md:px-12 md:py-14">
      {/* Hero */}
      <section className="max-w-3xl">
        <p className="eyebrow mb-4">Vision · Sessio</p>
        <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
          {MISSION}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-strong">
          {VISION}
        </p>
        <p className="mt-4 text-xs text-muted">
          Draft wording — swap in the exact mission &amp; vision from the deck.
        </p>
      </section>

      {/* Strategic pillars */}
      <section className="mt-14">
        <p className="eyebrow mb-4">The bets</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <Link
              key={p.title}
              href={`/division/${p.area}`}
              className="group rounded-2xl border border-border bg-surface/40 p-5 transition-colors hover:border-border-strong hover:bg-surface"
              style={{ boxShadow: `inset 0 2px 0 ${AREAS[p.area].color}` }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: AREAS[p.area].color }}
                />
                <h3 className="text-base font-semibold">{p.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted">{p.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* This quarter */}
      <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow mb-4">What&apos;s next</p>
          <ul className="flex flex-col gap-2">
            {upcoming.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 px-4 py-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: AREAS[m.area].color }}
                  />
                  <span className="text-sm">{m.title}</span>
                </div>
                <DateChip date={m.date} />
              </li>
            ))}
          </ul>
          <Link
            href="/timeline"
            className="mt-3 inline-block text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            See the full timeline →
          </Link>
        </div>

        <div>
          <p className="eyebrow mb-4">The divisions</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {divisions.map((a) => (
              <Link
                key={a}
                href={`/division/${a}`}
                className="group flex items-start gap-3 rounded-xl border border-border bg-surface/40 p-4 transition-colors hover:border-border-strong hover:bg-surface"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: AREAS[a].color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{AREAS[a].label}</h3>
                    <span className="text-[11px] text-muted">{count(a)}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {AREAS[a].objective}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
