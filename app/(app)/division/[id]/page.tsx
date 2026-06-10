import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoard, getEvents, getSectors } from "@/app/lib/store";
import {
  AREAS,
  AREA_ORDER,
  TIMES,
  cellId,
  type Area,
  type Milestone,
} from "@/app/lib/roadmap";
import { HORIZONS, buildJourney, type JourneyItem } from "@/app/lib/horizon";
import { OwnerChip, StatusPill } from "@/app/components/ui";
import InitiativeCard from "@/app/components/InitiativeCard";
import ProgressBar from "@/app/components/ProgressBar";

export const dynamic = "force-dynamic";

function isArea(id: string): id is Area {
  return (AREA_ORDER as string[]).includes(id);
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function relativeChip(event: Milestone, today: Date): string {
  const start = parseISO(event.iso);
  const end = event.isoEnd ? parseISO(event.isoEnd) : start;
  if (today >= start && today <= end) return "now";
  const days = Math.round((start.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 14) return `in ${days} days`;
  if (days <= 90) return `in ${Math.round(days / 7)} wks`;
  if (days <= 540) return `in ${Math.round(days / 30)} mo`;
  return `in ${(days / 365).toFixed(1).replace(".0", "")} yrs`;
}

export default async function DivisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isArea(id)) notFound();
  const area = id;
  const meta = AREAS[area];
  const [board, allEvents, sectors] = await Promise.all([
    getBoard(),
    getEvents(),
    getSectors(),
  ]);
  const sector = sectors[area] ?? {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const journey = buildJourney(
    today,
    allEvents.filter((e) => e.area === area),
    {
      now: board[cellId(area, "now")] ?? [],
      next: board[cellId(area, "next")] ?? [],
      later: board[cellId(area, "later")] ?? [],
    },
  );
  const allCards = TIMES.flatMap((t) => board[cellId(area, t)] ?? []);

  const nonEmpty = HORIZONS.filter(
    (h) => h.id === "vision" || journey[h.id].length > 0,
  );

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <Link
        href="/"
        className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Home
      </Link>

      {/* Sector header */}
      <header
        className="mt-4 mb-5 rounded-2xl border border-border bg-surface/40 p-6"
        style={{ boxShadow: `inset 4px 0 0 ${meta.color}` }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
          <h1 className="text-2xl font-semibold tracking-tight">{meta.label}</h1>
          {meta.owner && (
            <span className="ml-auto">
              <OwnerChip owner={meta.owner} />
            </span>
          )}
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">{meta.objective}</p>
        {sector.focus && (
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted-strong">
            <span className="eyebrow mr-2">Focus</span>
            {sector.focus}
          </p>
        )}
        {allCards.length > 0 && (
          <div className="mt-4">
            <ProgressBar cards={allCards} showLegend />
          </div>
        )}
      </header>

      {/* Horizon jump bar — from tomorrow to the vision */}
      <nav className="sticky top-0 z-10 -mx-2 mb-6 flex gap-1.5 overflow-x-auto bg-black/80 px-2 py-2.5 backdrop-blur">
        {nonEmpty.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              h.id === "vision"
                ? "border-transparent text-black"
                : "border-border text-muted hover:border-border-strong hover:text-foreground"
            }`}
            style={h.id === "vision" ? { backgroundColor: meta.color } : undefined}
          >
            {h.label}
          </a>
        ))}
      </nav>

      {/* The journey: today → vision */}
      <div className="max-w-3xl">
        <ol className="relative ml-2 border-l border-border">
          {nonEmpty.map((h) => (
            <li key={h.id} id={h.id} className="scroll-mt-16">
              <div className="relative pb-2 pl-6 pt-1">
                <span
                  className="absolute -left-[5px] top-2.5 h-2.5 w-2.5 rounded-full ring-4 ring-black"
                  style={{
                    backgroundColor: h.id === "vision" ? meta.color : "#3a3a40",
                  }}
                />
                <div className="flex items-baseline gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">{h.label}</h2>
                  <span className="col-label">{h.sub}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pb-7 pl-6">
                {h.id === "vision" ? (
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: `${meta.color}55`,
                      backgroundColor: `${meta.color}0d`,
                    }}
                  >
                    <p className="text-[15px] leading-relaxed text-foreground">
                      {sector.vision ?? meta.objective}
                    </p>
                    <p className="mt-2 text-[11px] text-muted">
                      Every step above climbs toward this.
                    </p>
                  </div>
                ) : (
                  journey[h.id].map((item) => (
                    <JourneyRow
                      key={item.kind === "card" ? item.card.id : item.event.id}
                      item={item}
                      color={meta.color}
                      today={today}
                    />
                  ))
                )}
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-2 text-xs text-muted">
          Dated items come from the strategy milestones and the hello@sessio.io
          calendar; undated ones from the{" "}
          <Link href="/roadmap" className="underline underline-offset-4">
            roadmap board
          </Link>
          . Click a card to unfold the detail.
        </p>
      </div>
    </div>
  );
}

function JourneyRow({
  item,
  color,
  today,
}: {
  item: JourneyItem;
  color: string;
  today: Date;
}) {
  if (item.kind === "card") {
    return <InitiativeCard card={item.card} color={color} />;
  }
  const e = item.event;
  return (
    <article
      className="rounded-xl border border-border bg-surface-elevated p-3.5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-muted-strong">{e.date}</span>
        <StatusPill status={e.status} />
        {e.source === "calendar" && (
          <span className="pill border border-border text-muted">📅 hello@</span>
        )}
        <span className="pill ml-auto border border-border text-muted">
          {relativeChip(e, today)}
        </span>
      </div>
      <h3 className="mt-1 text-[14px] font-medium leading-snug">{e.title}</h3>
      {e.location && <p className="mt-0.5 text-[12px] text-muted">{e.location}</p>}
    </article>
  );
}
