import { getLadder } from "@/app/lib/store";
import { RUNG_STATUS, type OneOhMoment, type Rung } from "@/app/lib/ladder";

export const dynamic = "force-dynamic";

const APP_COLOR = "#2563eb";
const PORTAL_COLOR = "#3ed4b1";

// A side counts as "really shipping" at a rung unless it's explicitly n/a,
// vision-only, quiet, or not built — those don't gate the other product.
function isReal(s?: string): boolean {
  return !!s && !/n\/a|vision-only|no new surface|not built/i.test(s);
}

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
          No ladder loaded yet — it lives in the private store.
        </p>
      ) : (
        <div className="max-w-5xl">
          {coreRelease && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PORTAL_COLOR }} />
              {coreRelease.label}
            </div>
          )}

          {/* Two products, one spine */}
          <div className="mb-3 grid grid-cols-[1fr_150px_1fr] items-end gap-3">
            <h2 className="text-right text-base font-semibold" style={{ color: APP_COLOR }}>
              App
            </h2>
            <div />
            <h2 className="text-base font-semibold" style={{ color: PORTAL_COLOR }}>
              Portal
            </h2>
          </div>

          <ol className="flex flex-col gap-2.5">
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

function SideCard({ text, color, align }: { text?: string; color: string; align: "left" | "right" }) {
  if (!isReal(text)) {
    return (
      <div className={`rounded-xl border border-dashed border-border/50 px-3.5 py-3 text-[11px] text-muted/60 ${align === "right" ? "text-right" : ""}`}>
        {text ?? "—"}
      </div>
    );
  }
  return (
    <div
      className="rounded-xl border border-border bg-surface-elevated px-3.5 py-3"
      style={align === "right" ? { borderRight: `3px solid ${color}` } : { borderLeft: `3px solid ${color}` }}
    >
      <p className={`text-[12.5px] leading-snug text-muted-strong ${align === "right" ? "text-right" : ""}`}>
        {text}
      </p>
    </div>
  );
}

function RungRow({ rung }: { rung: Rung }) {
  const st = RUNG_STATUS[rung.status];
  const together = isReal(rung.app) && isReal(rung.portal);
  return (
    <div className="relative grid grid-cols-[1fr_150px_1fr] items-center gap-3">
      {/* alignment tie across both products */}
      {together && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-[10%] right-[10%] top-1/2 -z-10 border-t border-dashed"
          style={{ borderColor: `${st.color}44` }}
        />
      )}

      <SideCard text={rung.app} color={APP_COLOR} align="right" />

      <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface/60 px-2 py-2.5 text-center">
        <span className="font-mono text-[12px] font-semibold text-muted-strong">{rung.id}</span>
        <span className="text-[12px] font-medium leading-tight">{rung.name}</span>
        <span className="pill" style={{ color: st.color, backgroundColor: `${st.color}1f` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.color }} />
          {st.label}
        </span>
        {together && (
          <span className="pill border border-border text-muted" title="App and portal must ship this together">
            ⇄ together
          </span>
        )}
      </div>

      <SideCard text={rung.portal} color={PORTAL_COLOR} align="left" />
    </div>
  );
}

function OneOhMarker({ moment }: { moment: OneOhMoment }) {
  return (
    <div className="mx-auto mt-2.5 max-w-md rounded-xl border p-3 text-center" style={{ borderColor: "#ffdd3355", backgroundColor: "#ffdd330f" }}>
      <span className="text-sm font-semibold" style={{ color: "#ffdd33" }}>◆ {moment.date}</span>
      <span className="ml-2 text-sm font-medium">1.0 moment</span>
      <p className="mt-0.5 text-[12px] text-muted">{moment.label}</p>
    </div>
  );
}
