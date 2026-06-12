import { Fragment } from "react";
import { getLadder } from "@/app/lib/store";
import { RUNG_STATUS, type OneOhMoment, type Rung } from "@/app/lib/ladder";

export const dynamic = "force-dynamic";

const APP_COLOR = "#2563eb";
const PORTAL_COLOR = "#3ed4b1";

// Muted = doesn't gate the other product (n/a, vision-only, quiet, not built).
function isMuted(s?: string): boolean {
  return !s || /n\/a|vision-only|no new surface|not built|stay vision/i.test(s);
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

          {/* Two products, one spine. ⇄ on a row = must land simultaneously. */}
          <div className="mb-3 grid grid-cols-[1fr_140px_1fr] items-end gap-3">
            <h2 className="text-right text-base font-semibold" style={{ color: APP_COLOR }}>
              App
            </h2>
            <div />
            <h2 className="text-base font-semibold" style={{ color: PORTAL_COLOR }}>
              Portal
            </h2>
          </div>

          <ol className="flex flex-col gap-3">
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

function StepChip({
  text,
  side,
  tieColor,
}: {
  text: string;
  side: "app" | "portal";
  tieColor?: string;
}) {
  const muted = isMuted(text);
  const accent = side === "app" ? APP_COLOR : PORTAL_COLOR;
  return (
    <div
      className={`flex h-full items-center gap-2 rounded-lg px-3 py-2 ${
        muted
          ? "border border-dashed border-border/50"
          : "border border-border bg-surface-elevated"
      }`}
      style={
        muted
          ? undefined
          : side === "app"
            ? { borderRight: `3px solid ${accent}` }
            : { borderLeft: `3px solid ${accent}` }
      }
    >
      {side === "portal" && tieColor && (
        <span className="shrink-0 text-[11px]" style={{ color: tieColor }}>⇄</span>
      )}
      <p
        className={`flex-1 text-[12px] leading-snug ${
          muted ? "text-muted/60" : "text-muted-strong"
        } ${side === "app" ? "text-right" : ""}`}
      >
        {text}
      </p>
      {side === "app" && tieColor && (
        <span className="shrink-0 text-[11px]" style={{ color: tieColor }}>⇄</span>
      )}
    </div>
  );
}

function RungRow({ rung }: { rung: Rung }) {
  const st = RUNG_STATUS[rung.status];
  // Fall back to the rung-level blobs when no granular steps exist (M1, M10).
  const steps =
    rung.steps && rung.steps.length > 0
      ? rung.steps
      : [{ app: rung.app, portal: rung.portal }];
  const rows = steps.length;

  return (
    <div className="grid grid-cols-[1fr_140px_1fr] gap-x-3 gap-y-1.5">
      <div
        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface/60 px-2 py-2.5 text-center"
        style={{ gridColumn: 2, gridRow: `1 / span ${rows}` }}
      >
        <span className="font-mono text-[12px] font-semibold text-muted-strong">{rung.id}</span>
        <span className="text-[12px] font-medium leading-tight">{rung.name}</span>
        <span className="pill" style={{ color: st.color, backgroundColor: `${st.color}1f` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.color }} />
          {st.label}
        </span>
      </div>

      {steps.map((s, i) => {
        const tied = !isMuted(s.app) && !isMuted(s.portal);
        return (
          <Fragment key={i}>
            <div style={{ gridColumn: 1, gridRow: i + 1 }}>
              {s.app && <StepChip text={s.app} side="app" tieColor={tied ? st.color : undefined} />}
            </div>
            <div style={{ gridColumn: 3, gridRow: i + 1 }}>
              {s.portal && (
                <StepChip text={s.portal} side="portal" tieColor={tied ? st.color : undefined} />
              )}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function OneOhMarker({ moment }: { moment: OneOhMoment }) {
  return (
    <div className="mx-auto mt-3 max-w-md rounded-xl border p-3 text-center" style={{ borderColor: "#ffdd3355", backgroundColor: "#ffdd330f" }}>
      <span className="text-sm font-semibold" style={{ color: "#ffdd33" }}>◆ {moment.date}</span>
      <span className="ml-2 text-sm font-medium">1.0 moment</span>
      <p className="mt-0.5 text-[12px] text-muted">{moment.label}</p>
    </div>
  );
}
