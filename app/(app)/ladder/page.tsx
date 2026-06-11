import { getLadder } from "@/app/lib/store";
import {
  LADDER_SOURCE,
  RUNG_STATUS,
  type OneOhMoment,
  type Rung,
} from "@/app/lib/ladder";

export const dynamic = "force-dynamic";

export default async function LadderPage() {
  const { rungs, coreRelease, oneOhMoment } = await getLadder();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-7 border-b border-border pb-6">
        <p className="eyebrow mb-2">Product roadmap</p>
        <h1 className="text-2xl font-semibold tracking-tight">The M-ladder</h1>
      </header>

      {rungs.length === 0 ? (
        <p className="max-w-2xl rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted">
          No ladder loaded yet. The roadmap content lives in the private store —
          seed it and this fills in.
        </p>
      ) : (
        <div className="max-w-3xl">
          {coreRelease && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#3ed4b1" }} />
              {coreRelease.label}
            </div>
          )}

          <ol className="relative ml-2 border-l border-border">
            {rungs.map((rung) => (
              <li key={rung.id}>
                <RungRow rung={rung} />
                {oneOhMoment && rung.id === oneOhMoment.after && (
                  <OneOhMarker moment={oneOhMoment} />
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function RungRow({ rung }: { rung: Rung }) {
  const st = RUNG_STATUS[rung.status];
  return (
    <div className="relative pb-3 pl-6">
      <span
        className="absolute -left-[7px] top-3 h-3.5 w-3.5 rounded-full ring-4 ring-black"
        style={{ backgroundColor: st.color }}
      />
      <div className="rounded-xl border border-border bg-surface-elevated p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-muted-strong">
            {rung.id}
          </span>
          <h2 className="text-[15px] font-semibold">{rung.name}</h2>
          <span
            className="pill ml-auto"
            style={{ color: st.color, backgroundColor: `${st.color}1f` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.color }} />
            {st.label}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-muted">{rung.scope}</p>
        {(rung.app || rung.portal) && (
          <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
            {rung.app && (
              <div className="rounded-lg bg-surface px-2.5 py-2">
                <span className="col-label" style={{ color: "#2563eb" }}>App</span>
                <p className="mt-0.5 text-[12px] leading-snug text-muted-strong">{rung.app}</p>
              </div>
            )}
            {rung.portal && (
              <div className="rounded-lg bg-surface px-2.5 py-2">
                <span className="col-label" style={{ color: "#3ed4b1" }}>Portal</span>
                <p className="mt-0.5 text-[12px] leading-snug text-muted-strong">{rung.portal}</p>
              </div>
            )}
          </div>
        )}
        {rung.runsOn.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {rung.runsOn.map((r) => (
              <span
                key={r}
                className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OneOhMarker({ moment }: { moment: OneOhMoment }) {
  return (
    <div className="relative mb-3 pl-6">
      <span
        className="absolute -left-[9px] top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ring-4 ring-black"
        style={{ backgroundColor: "#ffdd33", color: "#000" }}
      >
        ◆
      </span>
      <div
        className="rounded-xl border p-3.5"
        style={{ borderColor: "#ffdd3355", backgroundColor: "#ffdd330f" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#ffdd33" }}>
            {moment.date}
          </span>
          <span className="text-sm font-medium text-foreground">1.0 moment</span>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{moment.label}</p>
      </div>
    </div>
  );
}
