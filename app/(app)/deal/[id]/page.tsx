import Link from "next/link";
import { notFound } from "next/navigation";
import { getPipeline } from "@/app/lib/store";

export const dynamic = "force-dynamic";

const B2B = "#22d3ee";

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { stages, deals } = await getPipeline();
  const deal = deals.find((d) => d.id === id);
  if (!deal) notFound();
  const stageIdx = stages.indexOf(deal.stage);

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <Link href="/division/b2b" className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
        ← B2B
      </Link>

      <header className="mt-4 mb-6 rounded-2xl border border-border bg-surface/40 p-6" style={{ boxShadow: `inset 4px 0 0 ${B2B}` }}>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{deal.org}</h1>
          <span className="pill border border-border text-muted">{deal.kind}</span>
          {deal.owner && <span className="ml-auto text-[12px] text-muted">Owner: {deal.owner}</span>}
        </div>
        {deal.contacts && deal.contacts !== "—" && (
          <p className="mt-1.5 text-sm text-muted-strong">{deal.contacts}</p>
        )}

        {/* Stage progress */}
        <div className="mt-5">
          <div className="flex items-center gap-1.5">
            {stages.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: i <= stageIdx ? B2B : "#2a2a2e" }}
                />
                <p className={`mt-1.5 text-[10.5px] leading-tight ${i === stageIdx ? "font-semibold text-foreground" : "text-muted"}`}>
                  {s}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <p className="eyebrow mb-1.5">Next meeting</p>
            {deal.nextMeeting ? (
              <p className="text-[13.5px] leading-relaxed text-foreground">
                {deal.nextMeeting.at} — {deal.nextMeeting.label}
              </p>
            ) : (
              <p className="text-[13.5px] text-muted">None booked — worth fixing?</p>
            )}
          </div>
          {deal.last && (
            <div className="rounded-xl border border-border bg-surface-elevated p-4">
              <p className="eyebrow mb-1.5">Latest</p>
              <p className="text-[13.5px] leading-relaxed text-muted-strong">{deal.last}</p>
            </div>
          )}
          {deal.next && (
            <div className="rounded-xl border p-4" style={{ borderColor: `${B2B}44`, backgroundColor: `${B2B}0d` }}>
              <p className="eyebrow mb-1.5" style={{ color: B2B }}>Next step</p>
              <p className="text-[13.5px] leading-relaxed text-foreground">{deal.next}</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">History</h2>
          {(deal.history?.length ?? 0) === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted">No entries yet.</p>
          ) : (
            <ol className="relative ml-1 border-l border-border">
              {[...deal.history!].reverse().map((h, i) => (
                <li key={i} className="relative pb-4 pl-5 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-black" style={{ backgroundColor: B2B }} />
                  <p className="text-[11px] text-muted">{h.at}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-strong">{h.note}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
