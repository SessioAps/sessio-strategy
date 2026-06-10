import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoard, getMilestones } from "@/app/lib/store";
import {
  AREAS,
  AREA_ORDER,
  TIMES,
  TIME_META,
  cellId,
  type Area,
} from "@/app/lib/roadmap";
import { DateChip, OwnerChip, StatusPill } from "@/app/components/ui";

export const dynamic = "force-dynamic";

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
  const [board, allMilestones] = await Promise.all([getBoard(), getMilestones()]);
  const milestones = allMilestones
    .filter((m) => m.area === area)
    .sort((a, b) => a.iso.localeCompare(b.iso));

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <Link
        href="/roadmap"
        className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Roadmap
      </Link>

      {/* Division header */}
      <header
        className="mt-4 mb-8 rounded-2xl border border-border bg-surface/40 p-6"
        style={{ boxShadow: `inset 4px 0 0 ${meta.color}` }}
      >
        <div className="mb-2 flex items-center gap-2.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <p className="eyebrow" style={{ color: meta.color }}>
            Division
          </p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{meta.label}</h1>
        <p className="mt-2 max-w-2xl text-base text-muted-strong">{meta.objective}</p>
        {meta.owner && (
          <div className="mt-4">
            <OwnerChip owner={meta.owner} />
          </div>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Initiatives by time */}
        <div className="flex flex-col gap-7">
          {TIMES.map((time) => {
            const cards = board[cellId(area, time)] ?? [];
            return (
              <section key={time}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {TIME_META[time].label}
                  </h2>
                  <span className="col-label">{TIME_META[time].sub}</span>
                </div>
                {cards.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">
                    Nothing here yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {cards.map((card) => (
                      <article
                        key={card.id}
                        className="rounded-xl border border-border bg-surface-elevated p-4"
                        style={{ borderLeft: `3px solid ${meta.color}` }}
                      >
                        <h3 className="text-[15px] font-medium leading-snug">
                          {card.title}
                        </h3>
                        {card.note && (
                          <p className="mt-1 text-[13px] leading-snug text-muted-strong">
                            {card.note}
                          </p>
                        )}
                        {card.detail && (
                          <p className="mt-2 text-[13px] leading-relaxed text-muted">
                            {card.detail}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <StatusPill status={card.status} />
                          <DateChip date={card.date} />
                          <OwnerChip owner={card.owner} />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Division timeline */}
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
                  {m.location && (
                    <div className="text-[11px] text-muted">{m.location}</div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
