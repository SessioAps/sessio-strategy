import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoard, getMilestones, getSectors } from "@/app/lib/store";
import {
  AREAS,
  AREA_ORDER,
  TIMES,
  TIME_META,
  cellId,
  type Area,
} from "@/app/lib/roadmap";
import { OwnerChip, StatusPill } from "@/app/components/ui";
import InitiativeCard from "@/app/components/InitiativeCard";
import ProgressBar from "@/app/components/ProgressBar";

export const dynamic = "force-dynamic";

const HORIZON: Record<(typeof TIMES)[number], { title: string; sub: string }> = {
  now: { title: "Now", sub: "Short-term actions — in flight" },
  next: { title: "Next", sub: "Up next" },
  later: { title: "Later", sub: "Long term — toward the vision" },
};

function isArea(id: string): id is Area {
  return (AREA_ORDER as string[]).includes(id);
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
  const [board, allMilestones, sectors] = await Promise.all([
    getBoard(),
    getMilestones(),
    getSectors(),
  ]);
  const sector = sectors[area] ?? {};
  const milestones = allMilestones
    .filter((m) => m.area === area)
    .sort((a, b) => a.iso.localeCompare(b.iso));
  const allCards = TIMES.flatMap((t) => board[cellId(area, t)] ?? []);

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <Link
        href="/"
        className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Home
      </Link>

      {/* Sector header: who, where it's going, what's in focus */}
      <header
        className="mt-4 mb-6 rounded-2xl border border-border bg-surface/40 p-6"
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

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {sector.vision && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: `${meta.color}44`, backgroundColor: `${meta.color}0d` }}
            >
              <p className="eyebrow mb-1.5" style={{ color: meta.color }}>
                The vision · 5 years
              </p>
              <p className="text-[14px] leading-relaxed text-foreground">{sector.vision}</p>
            </div>
          )}
          {sector.focus && (
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <p className="eyebrow mb-1.5">Focus right now</p>
              <p className="text-[14px] leading-relaxed text-muted-strong">{sector.focus}</p>
            </div>
          )}
        </div>

        {allCards.length > 0 && (
          <div className="mt-5">
            <ProgressBar cards={allCards} showLegend />
          </div>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* From short-term actions to the long-term vision */}
        <div className="flex flex-col gap-7">
          {TIMES.map((time) => {
            const cards = board[cellId(area, time)] ?? [];
            return (
              <section key={time}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {HORIZON[time].title}
                  </h2>
                  <span className="col-label">{HORIZON[time].sub}</span>
                  <span className="ml-auto text-[11px] text-muted">{TIME_META[time].sub}</span>
                </div>
                {cards.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
                    Nothing here yet — add it on the{" "}
                    <Link href="/roadmap" className="underline underline-offset-4">
                      roadmap board
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cards.map((card) => (
                      <InitiativeCard key={card.id} card={card} color={meta.color} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Dated milestones for this sector */}
        <aside>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Key dates</h2>
          {milestones.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
              No dated milestones yet.
            </p>
          ) : (
            <ol className="relative ml-1 border-l border-border">
              {milestones.map((m) => (
                <li key={m.id} className="relative pb-5 pl-5 last:pb-0">
                  <span
                    className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-black"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.date}</span>
                    <StatusPill status={m.status} />
                  </div>
                  <div className="mt-0.5 text-sm text-muted-strong">{m.title}</div>
                  {m.location && <div className="text-[11px] text-muted">{m.location}</div>}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
