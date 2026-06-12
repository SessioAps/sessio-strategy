import Link from "next/link";
import { getBoard, getEvents, getLadder, getSectors } from "@/app/lib/store";
import {
  AREA_ORDER,
  AREAS,
  TIMES,
  cellId,
  type Area,
  type Card,
} from "@/app/lib/roadmap";
import ProgressBar from "@/app/components/ProgressBar";

export const dynamic = "force-dynamic";

// NOTE: mission / vision copy is a draft — swap in the exact wording from the deck.
const MISSION =
  "Give music creators and the people around them the tools to make great work together.";
const VISION =
  "In five years, Sessio is the operating system for the music industry, worldwide.";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function relativeLabel(start: Date, end: Date, today: Date): string {
  if (today >= start && today <= end) return "now";
  const days = Math.round((start.getTime() - today.getTime()) / 86400000);
  if (days === 1) return "tomorrow";
  if (days <= 14) return `in ${days} days`;
  if (days <= 60) return `in ${Math.round(days / 7)} wks`;
  return `in ${Math.round(days / 30)} mo`;
}

export default async function HomePage() {
  const [board, milestones, ladder, sectors] = await Promise.all([
    getBoard(),
    getEvents(),
    getLadder(),
    getSectors(),
  ]);
  const divisions = AREA_ORDER.filter((a) => a !== "milestones");
  const today = startOfDay(new Date());

  // What's happening: ongoing first, then nearest upcoming.
  const happening = milestones
    .map((m) => ({ m, s: parseISO(m.iso), e: parseISO(m.isoEnd ?? m.iso) }))
    .filter(({ e }) => e >= today)
    .sort((a, b) => a.s.getTime() - b.s.getTime())
    .slice(0, 4);

  // Product pulse from the ladder.
  const shipped = ladder.rungs.filter((r) => r.status === "shipped").length;
  const building = ladder.rungs.find((r) => r.status === "building");

  const sectorCards = (a: Area): Card[] =>
    TIMES.flatMap((t) => board[cellId(a, t)] ?? []);
  const topNow = (a: Area): Card | undefined =>
    (board[cellId(a, "now")] ?? [])[0] ?? (board[cellId(a, "next")] ?? [])[0];

  return (
    <div className="px-6 py-10 md:px-12 md:py-12">
      {/* The north star */}
      <section className="max-w-3xl">
        <p className="eyebrow mb-3">Sessio · Strategy home</p>
        <h1 className="text-balance text-3xl font-semibold leading-[1.15] tracking-tight md:text-4xl">
          {MISSION}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-strong">
          {VISION}
        </p>
      </section>

      {/* Happening now + product pulse */}
      <section className="mt-10 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface/40 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="eyebrow">Happening</p>
            <Link
              href="/roadmap?view=time"
              className="text-[11px] text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              Timeline →
            </Link>
          </div>
          {happening.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nothing on the near horizon.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {happening.map(({ m, s, e }) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-elevated px-3 py-2.5"
                  style={{ borderLeft: `3px solid ${AREAS[m.area].color}` }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{m.title}</p>
                    <p className="text-[11px] text-muted">
                      {m.date}
                      {m.location ? ` · ${m.location}` : ""}
                    </p>
                  </div>
                  <span
                    className={`pill shrink-0 ${
                      relativeLabel(s, e, today) === "now"
                        ? "bg-accent-green/15 text-accent-green"
                        : "border border-border text-muted"
                    }`}
                  >
                    {relativeLabel(s, e, today)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/ladder"
          className="card-lift group rounded-2xl border border-border bg-surface/40 p-4 transition-colors hover:border-border-strong"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <p className="eyebrow">Product pulse</p>
            <span className="text-[11px] text-muted group-hover:text-foreground">
              M-ladder →
            </span>
          </div>
          {ladder.rungs.length === 0 ? (
            <p className="py-2 text-sm text-muted">Ladder not loaded yet.</p>
          ) : (
            <div>
              <div className="flex items-end gap-1.5">
                {ladder.rungs.map((r) => (
                  <div
                    key={r.id}
                    title={`${r.id} — ${r.name}`}
                    className="h-7 flex-1 rounded-sm"
                    style={{
                      backgroundColor:
                        r.status === "shipped"
                          ? "#3ed4b1"
                          : r.status === "building"
                            ? "#2563eb"
                            : "#2a2a2e",
                    }}
                  />
                ))}
              </div>
              <p className="mt-3 text-[13px] text-muted-strong">
                {shipped} of {ladder.rungs.length} rungs shipped
                {building ? (
                  <>
                    {" "}
                    · now building{" "}
                    <span className="font-medium text-foreground">
                      {building.id} — {building.name}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          )}
        </Link>
      </section>

      {/* The sectors: one readable card each — NOW + VISION, click to zoom in */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="eyebrow">The sectors</p>
          <Link
            href="/roadmap"
            className="text-[11px] text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Full board →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {divisions.map((a) => {
            const cards = sectorCards(a);
            const now = topNow(a);
            const vision = sectors[a]?.vision;
            return (
              <Link
                key={a}
                href={`/division/${a}`}
                className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 p-5 transition-colors hover:border-border-strong hover:bg-surface"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-0.5 transition-all group-hover:h-1"
                  style={{ backgroundColor: AREAS[a].color }}
                />
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: AREAS[a].color }}
                  />
                  <h3 className="text-[15px] font-semibold">{AREAS[a].label}</h3>
                  {AREAS[a].owner && (
                    <span className="ml-auto text-[11px] text-muted">{AREAS[a].owner}</span>
                  )}
                </div>

                <div className="mt-3">
                  <ProgressBar cards={cards} />
                </div>

                <div className="mt-4 flex flex-col gap-2.5 text-[12.5px] leading-snug">
                  <div>
                    <span className="col-label" style={{ color: AREAS[a].color }}>
                      Now
                    </span>
                    <p className="mt-0.5 line-clamp-2 text-muted-strong">
                      {now ? now.title : "Nothing in flight."}
                    </p>
                  </div>
                  <div>
                    <span className="col-label">Vision</span>
                    <p className="mt-0.5 line-clamp-2 text-muted">
                      {vision ?? AREAS[a].objective}
                    </p>
                  </div>
                </div>

                <span className="mt-4 text-[11px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  Zoom in →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
