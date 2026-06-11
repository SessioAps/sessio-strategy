import { getPipeline } from "@/app/lib/store";

export const dynamic = "force-dynamic";

const KIND_COLOR: Record<string, string> = {
  Publisher: "#aa6dfc",
  Label: "#2563eb",
  PRO: "#ffdd33",
  School: "#3ed4b1",
};

export default async function PipelinePage() {
  const { stages, deals } = await getPipeline();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6 border-b border-border pb-6">
        <p className="eyebrow mb-2">Publishers</p>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
      </header>

      {stages.length === 0 ? (
        <p className="max-w-2xl rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted">
          No pipeline loaded yet — it lives in the private store.
        </p>
      ) : (
        <div className="app-scroll overflow-x-auto pb-3">
          <div className="flex min-w-max gap-3">
            {stages.map((stage) => {
              const inStage = deals.filter((d) => d.stage === stage);
              return (
                <div key={stage} className="w-72 shrink-0">
                  <div className="mb-2.5 flex items-baseline justify-between rounded-lg border border-border bg-surface/40 px-3 py-2">
                    <span className="text-sm font-semibold">{stage}</span>
                    <span className="text-[11px] text-muted">{inStage.length}</span>
                  </div>
                  <div className="flex min-h-[120px] flex-col gap-2">
                    {inStage.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 py-4 text-center text-[11px] text-muted/60">—</div>
                    ) : (
                      inStage.map((d) => (
                        <article
                          key={d.id}
                          className="rounded-xl border border-border bg-surface-elevated p-3.5"
                          style={{ borderLeft: `3px solid ${KIND_COLOR[d.kind] ?? "#8f9098"}` }}
                        >
                          <div className="flex items-center gap-2">
                            <h2 className="text-[14px] font-semibold leading-snug">{d.org}</h2>
                            <span
                              className="pill ml-auto"
                              style={{ color: KIND_COLOR[d.kind] ?? "#8f9098", backgroundColor: `${KIND_COLOR[d.kind] ?? "#8f9098"}1f` }}
                            >
                              {d.kind}
                            </span>
                          </div>
                          {d.contacts && d.contacts !== "—" && (
                            <p className="mt-1 text-[11.5px] text-muted">{d.contacts}{d.owner ? ` · owner ${d.owner}` : ""}</p>
                          )}
                          {d.last && (
                            <p className="mt-2 text-[12px] leading-snug text-muted-strong">{d.last}</p>
                          )}
                          {d.next && (
                            <p className="mt-1.5 text-[12px] leading-snug text-muted">
                              <span className="col-label mr-1.5">Next</span>{d.next}
                            </p>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
