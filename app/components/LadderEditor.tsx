"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BAND_ORDER,
  BAND_META,
  RUNG_STATUS,
  type Band,
  type LadderPayload,
  type OneOhMoment,
  type Rung,
  type RungStatus,
} from "@/app/lib/ladder";

const APP_COLOR = "#2563eb";
const PORTAL_COLOR = "#3ed4b1";
const RUNS_ON = ["Web", "App", "Portal", "API"] as const;
type Side = "app" | "portal";
const END = -1;

function isMuted(s?: string): boolean {
  return !s || /n\/a|vision-only|no new surface|not built|stay vision/i.test(s);
}

// M-stages are a LOCKED backbone — never reordered here. We only group them by
// band for display (a stage's band can still change via the edit modal).
function normalize(rungs: Rung[]): Rung[] {
  return [...rungs].sort(
    (a, b) =>
      BAND_ORDER.indexOf(a.band ?? "need") - BAND_ORDER.indexOf(b.band ?? "need"),
  );
}

// The movable unit is a single feature chip. Each rung's chips are derived from
// its steps[] (each side that is set = one chip); fall back to the rung-level
// app/portal summary when there are no steps.
function chipsOf(rung: Rung, side: Side): string[] {
  const src =
    rung.steps && rung.steps.length > 0
      ? rung.steps
      : [{ app: rung.app, portal: rung.portal }];
  return src.map((s) => s[side]).filter((t): t is string => Boolean(t));
}

type ChipMap = Record<string, { app: string[]; portal: string[] }>;

function buildChipMap(rungs: Rung[]): ChipMap {
  const map: ChipMap = {};
  for (const r of rungs) map[r.id] = { app: chipsOf(r, "app"), portal: chipsOf(r, "portal") };
  return map;
}

// Serialize chip lists back onto each rung as single-sided steps[] (chips are
// independent now — no forced app/portal pairing), keeping app/portal summaries.
function applyChipMap(rungs: Rung[], map: ChipMap): Rung[] {
  return normalize(
    rungs.map((r) => {
      const a = map[r.id]?.app ?? chipsOf(r, "app");
      const p = map[r.id]?.portal ?? chipsOf(r, "portal");
      const next: Rung = { ...r };
      const steps = [...a.map((t) => ({ app: t })), ...p.map((t) => ({ portal: t }))];
      if (steps.length) next.steps = steps;
      else delete next.steps;
      if (a.length) next.app = a.join(", ");
      else delete next.app;
      if (p.length) next.portal = p.join(", ");
      else delete next.portal;
      return next;
    }),
  );
}

function chipId(rungId: string, side: Side, idx: number) {
  return `c|${rungId}|${side}|${idx}`;
}
function zoneId(rungId: string, side: Side) {
  return `z|${rungId}|${side}`;
}
function parseChip(id: string): { rung: string; side: Side; idx: number } | null {
  const p = id.split("|");
  if (p[0] !== "c") return null;
  return { rung: p[1], side: p[2] as Side, idx: Number(p[3]) };
}

export default function LadderEditor({
  initialLadder,
}: {
  initialLadder: LadderPayload;
}) {
  const [ladder, setLadder] = useState<LadderPayload>(() => ({
    ...initialLadder,
    rungs: normalize(initialLadder.rungs),
  }));
  const rungs = ladder.rungs;
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Rung | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const firstSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    setSaving("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/ladder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ladder),
      })
        .then((r) => setSaving(r.ok ? "saved" : "idle"))
        .catch(() => setSaving("idle"));
    }, 600);
  }, [ladder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function setRungs(next: Rung[]) {
    setLadder((l) => ({ ...l, rungs: next }));
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveChipId(String(e.active.id));
  }

  // Move a single chip: reorder within a column, or move to another stage's
  // same-side column. Stages themselves never move.
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveChipId(null);
    if (!over) return;
    const a = parseChip(String(active.id));
    if (!a) return;

    const overStr = String(over.id);
    let toRung: string;
    let toSide: Side;
    let toIdx: number;
    if (overStr.startsWith("z|")) {
      const p = overStr.split("|");
      toRung = p[1];
      toSide = p[2] as Side;
      toIdx = END;
    } else {
      const o = parseChip(overStr);
      if (!o) return;
      toRung = o.rung;
      toSide = o.side;
      toIdx = o.idx;
    }
    // App chips live with App, Portal with Portal — never cross sides.
    if (a.side !== toSide) return;
    if (a.rung === toRung && a.idx === toIdx) return;

    const map = buildChipMap(rungs);
    if (a.rung === toRung) {
      const list = map[a.rung][a.side];
      const dest = toIdx === END ? list.length - 1 : toIdx;
      map[a.rung][a.side] = arrayMove(list, a.idx, dest);
    } else {
      const [text] = map[a.rung][a.side].splice(a.idx, 1);
      if (text === undefined) return;
      const destList = map[toRung][toSide];
      const dest = toIdx === END ? destList.length : toIdx;
      destList.splice(dest, 0, text);
    }
    setRungs(applyChipMap(rungs, map));
  }

  function deleteChip(rungId: string, side: Side, idx: number) {
    const map = buildChipMap(rungs);
    map[rungId][side].splice(idx, 1);
    setRungs(applyChipMap(rungs, map));
  }

  function saveStage(next: Rung) {
    setRungs(normalize(rungs.map((r) => (r === editing ? next : r))));
    setEditing(null);
  }

  const activeChip = (() => {
    if (!activeChipId) return null;
    const a = parseChip(activeChipId);
    if (!a) return null;
    return { text: chipsOf(rungs.find((r) => r.id === a.rung) ?? ({} as Rung), a.side)[a.idx], side: a.side };
  })();

  const bands = BAND_ORDER.map((band) => {
    const group = rungs.filter((r) => (r.band ?? "need") === band);
    if (group.length === 0) return null;
    const meta = BAND_META[band];
    return (
      <section key={band} className="mb-6">
        <div className="mb-2 flex items-baseline gap-2">
          <span
            className="h-2.5 w-2.5 translate-y-[1px] rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <h2 className="text-sm font-semibold tracking-tight">{meta.label}</h2>
          {meta.sub && <span className="text-xs text-muted">· {meta.sub}</span>}
        </div>
        <div className="flex flex-col gap-3">
          {group.map((rung) => (
            <RungRow
              key={rung.id}
              rung={rung}
              interactive={mounted}
              oneOhMoment={ladder.oneOhMoment}
              onEditStage={() => setEditing(rung)}
              onDeleteChip={deleteChip}
            />
          ))}
        </div>
      </section>
    );
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        {ladder.coreRelease && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PORTAL_COLOR }} />
            {ladder.coreRelease.label}
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted">
          Stages are fixed · drag a feature between stages · click ✎ to edit a stage
        </span>
        <SaveDot state={saving} />
      </div>

      <div className="mb-4 flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: APP_COLOR }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: APP_COLOR }} />
          App
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: PORTAL_COLOR }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PORTAL_COLOR }} />
          Portal
        </span>
      </div>

      {mounted ? (
        <DndContext
          id="sessio-ladder-dnd"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {bands}
          <DragOverlay dropAnimation={null}>
            {activeChip?.text ? <Chip text={activeChip.text} side={activeChip.side} overlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        bands
      )}

      {editing && (
        <StageEditor
          key={editing.id}
          initial={editing}
          onSave={saveStage}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function SaveDot({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "idle") return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: state === "saving" ? "#e0a82e" : "#3ed4b1" }}
      />
      {state === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}

function RungRow({
  rung,
  interactive,
  oneOhMoment,
  onEditStage,
  onDeleteChip,
}: {
  rung: Rung;
  interactive: boolean;
  oneOhMoment: OneOhMoment | null;
  onEditStage: () => void;
  onDeleteChip: (rungId: string, side: Side, idx: number) => void;
}) {
  const st = RUNG_STATUS[rung.status];
  return (
    <>
      <div className="flex items-center gap-3">
        <ChipColumn
          rungId={rung.id}
          side="app"
          chips={chipsOf(rung, "app")}
          interactive={interactive}
          onDeleteChip={onDeleteChip}
        />
        {/* Locked stage spine */}
        <div
          className="group/stage relative flex w-[150px] shrink-0 flex-col items-center justify-center gap-1 self-center rounded-xl border border-border bg-surface/60 px-2 py-2.5 text-center"
          style={{ borderLeft: `3px solid ${st.color}` }}
        >
          <button
            type="button"
            aria-label="Edit stage"
            onClick={onEditStage}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-white/10 hover:text-foreground group-hover/stage:opacity-100"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="font-mono text-[12px] font-semibold text-muted-strong">{rung.id}</span>
          <span className="text-[12px] font-medium leading-tight">{rung.name}</span>
          <span className="pill" style={{ color: st.color, backgroundColor: `${st.color}1f` }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.color }} />
            {st.label}
          </span>
        </div>
        <ChipColumn
          rungId={rung.id}
          side="portal"
          chips={chipsOf(rung, "portal")}
          interactive={interactive}
          onDeleteChip={onDeleteChip}
        />
      </div>
      {oneOhMoment && rung.id === oneOhMoment.after && <OneOhMarker moment={oneOhMoment} />}
    </>
  );
}

function ChipColumn({
  rungId,
  side,
  chips,
  interactive,
  onDeleteChip,
}: {
  rungId: string;
  side: Side;
  chips: string[];
  interactive: boolean;
  onDeleteChip: (rungId: string, side: Side, idx: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId(rungId, side) });
  const inner = (
    <div
      ref={interactive ? setNodeRef : undefined}
      className={`flex min-h-[44px] flex-1 flex-col gap-1.5 rounded-lg p-1 ${
        side === "app" ? "items-end" : "items-start"
      } ${interactive && isOver ? "bg-white/[0.04]" : ""}`}
    >
      {chips.length === 0 && (
        <span className="px-2 py-1 text-[11px] text-muted/40">{interactive ? "drop here" : ""}</span>
      )}
      {chips.map((text, i) =>
        interactive ? (
          <SortableChip
            key={i}
            id={chipId(rungId, side, i)}
            text={text}
            side={side}
            onDelete={() => onDeleteChip(rungId, side, i)}
          />
        ) : (
          <Chip key={i} text={text} side={side} />
        ),
      )}
    </div>
  );
  return interactive ? (
    <SortableContext
      items={chips.map((_, i) => chipId(rungId, side, i))}
      strategy={verticalListSortingStrategy}
    >
      {inner}
    </SortableContext>
  ) : (
    inner
  );
}

function SortableChip({
  id,
  text,
  side,
  onDelete,
}: {
  id: string;
  text: string;
  side: Side;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="max-w-full">
      <Chip text={text} side={side} onDelete={onDelete} draggable />
    </div>
  );
}

function Chip({
  text,
  side,
  onDelete,
  draggable,
  overlay,
}: {
  text: string;
  side: Side;
  onDelete?: () => void;
  draggable?: boolean;
  overlay?: boolean;
}) {
  const muted = isMuted(text);
  const accent = side === "app" ? APP_COLOR : PORTAL_COLOR;
  return (
    <div
      className={`group/chip relative flex items-center gap-2 rounded-lg px-3 py-2 ${
        muted ? "border border-dashed border-border/50" : "border border-border bg-surface-elevated"
      } ${draggable ? "cursor-grab touch-none active:cursor-grabbing" : ""} ${
        overlay ? "rotate-[1deg] shadow-2xl shadow-black/60 ring-1 ring-white/10" : ""
      }`}
      style={
        muted
          ? undefined
          : side === "app"
            ? { borderRight: `3px solid ${accent}` }
            : { borderLeft: `3px solid ${accent}` }
      }
    >
      <p
        className={`text-[12px] leading-snug ${muted ? "text-muted/60" : "text-muted-strong"} ${
          side === "app" ? "text-right" : ""
        }`}
      >
        {text}
      </p>
      {onDelete && (
        <button
          type="button"
          aria-label="Remove feature"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted opacity-0 transition hover:bg-white/10 hover:text-foreground group-hover/chip:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

function OneOhMarker({ moment }: { moment: OneOhMoment }) {
  return (
    <div
      className="mx-auto my-1 max-w-md rounded-xl border p-3 text-center"
      style={{ borderColor: "#ffdd3355", backgroundColor: "#ffdd330f" }}
    >
      <span className="text-sm font-semibold" style={{ color: "#ffdd33" }}>
        ◆ {moment.date}
      </span>
      <span className="ml-2 text-sm font-medium">1.0 moment</span>
      <p className="mt-0.5 text-[12px] text-muted">{moment.label}</p>
    </div>
  );
}

// --- Stage edit modal (metadata + the stage's feature lists) ----------------
const FIELD =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-white/25";
const LABEL = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted";

function StageEditor({
  initial,
  onSave,
  onClose,
}: {
  initial: Rung;
  onSave: (rung: Rung) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [scope, setScope] = useState(initial.scope);
  const [status, setStatus] = useState<RungStatus>(initial.status);
  const [band, setBand] = useState<Band>(initial.band ?? "need");
  const [runsOn, setRunsOn] = useState<string[]>(initial.runsOn ?? []);
  const [appChips, setAppChips] = useState<string[]>(chipsOf(initial, "app"));
  const [portalChips, setPortalChips] = useState<string[]>(chipsOf(initial, "portal"));

  function toggleRunsOn(v: string) {
    setRunsOn((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    const a = appChips.map((t) => t.trim()).filter(Boolean);
    const p = portalChips.map((t) => t.trim()).filter(Boolean);
    const steps = [...a.map((t) => ({ app: t })), ...p.map((t) => ({ portal: t }))];
    const next: Rung = {
      ...initial,
      name: cleanName,
      scope: scope.trim(),
      runsOn,
      status,
      band,
      ...(a.length ? { app: a.join(", ") } : {}),
      ...(p.length ? { portal: p.join(", ") } : {}),
      ...(steps.length ? { steps } : {}),
    };
    if (!a.length) delete next.app;
    if (!p.length) delete next.portal;
    if (!steps.length) delete next.steps;
    onSave(next);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5"
      >
        <h3 className="mb-1 text-sm font-semibold">Edit stage</h3>
        <p className="mb-4 text-[11px] text-muted">
          <span className="font-mono">{initial.id}</span> is a fixed stage — its position is locked.
        </p>

        <label className={LABEL}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={FIELD} autoFocus />

        <div className="mt-3">
          <label className={LABEL}>Scope</label>
          <textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={3} className={FIELD} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as RungStatus)} className={FIELD}>
              {(Object.keys(RUNG_STATUS) as RungStatus[]).map((s) => (
                <option key={s} value={s}>
                  {RUNG_STATUS[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Band</label>
            <select value={band} onChange={(e) => setBand(e.target.value as Band)} className={FIELD}>
              {BAND_ORDER.map((b) => (
                <option key={b} value={b}>
                  {BAND_META[b].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className={LABEL}>Runs on</label>
          <div className="flex flex-wrap gap-1.5">
            {RUNS_ON.map((v) => {
              const on = runsOn.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleRunsOn(v)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    on
                      ? "border-white/20 bg-white/[0.08] text-foreground"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <ChipListEditor label="App features" color={APP_COLOR} chips={appChips} setChips={setAppChips} />
          <ChipListEditor
            label="Portal features"
            color={PORTAL_COLOR}
            chips={portalChips}
            setChips={setPortalChips}
          />
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function ChipListEditor({
  label,
  color,
  chips,
  setChips,
}: {
  label: string;
  color: string;
  chips: string[];
  setChips: (next: string[]) => void;
}) {
  return (
    <div>
      <label className={LABEL} style={{ color }}>
        {label}
      </label>
      <div className="flex flex-col gap-1.5">
        {chips.map((t, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              value={t}
              onChange={(e) => setChips(chips.map((x, idx) => (idx === i ? e.target.value : x)))}
              placeholder="Feature"
              className={FIELD}
              style={{ borderLeft: `3px solid ${color}` }}
            />
            <button
              type="button"
              onClick={() => setChips(chips.filter((_, idx) => idx !== i))}
              aria-label="Remove"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-white/10 hover:text-foreground"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setChips([...chips, ""])}
        className="mt-1.5 text-[12px] text-muted transition hover:text-foreground"
      >
        + add
      </button>
    </div>
  );
}
