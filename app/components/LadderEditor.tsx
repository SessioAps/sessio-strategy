"use client";

import { Fragment, useEffect, useRef, useState } from "react";
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

function isMuted(s?: string): boolean {
  return !s || /n\/a|vision-only|no new surface|not built|stay vision/i.test(s);
}

// Keep the rung array grouped by band (stable within a band) so the stored JSON
// stays tidy and the filtered render is contiguous. JS sort is stable.
function normalize(rungs: Rung[]): Rung[] {
  return [...rungs].sort(
    (a, b) =>
      BAND_ORDER.indexOf(a.band ?? "need") - BAND_ORDER.indexOf(b.band ?? "need"),
  );
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ rung: Rung | null; band: Band } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const firstSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Persist the whole payload (debounced) on any change.
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
    setLadder((l) => ({ ...l, rungs: normalize(next) }));
  }

  function bandOf(id: string): Band {
    return rungs.find((r) => r.id === id)?.band ?? "need";
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const activeIdStr = String(active.id);
    const overId = String(over.id);
    if (activeIdStr === overId) return;

    const activeIdx = rungs.findIndex((r) => r.id === activeIdStr);
    if (activeIdx === -1) return;

    // Target band: dropping on a band lane, or onto another rung.
    let targetBand: Band;
    let overRungId: string | null = null;
    if (overId.startsWith("band:")) {
      targetBand = overId.slice(5) as Band;
    } else {
      targetBand = bandOf(overId);
      overRungId = overId;
    }

    const moved: Rung = { ...rungs[activeIdx], band: targetBand };
    const without = rungs.filter((r) => r.id !== activeIdStr);
    let insertAt: number;
    if (overRungId) {
      insertAt = without.findIndex((r) => r.id === overRungId);
      if (insertAt === -1) insertAt = without.length;
    } else {
      // Dropped on an empty/whole band lane → end of that band's group.
      const last = without.map((r) => r.band ?? "need").lastIndexOf(targetBand);
      insertAt = last === -1 ? without.length : last + 1;
    }
    setRungs([...without.slice(0, insertAt), moved, ...without.slice(insertAt)]);
  }

  function saveRung(next: Rung) {
    setRungs(
      editing?.rung
        ? rungs.map((r) => (r === editing.rung ? next : r))
        : [...rungs, next],
    );
    setEditing(null);
  }

  function deleteRung() {
    if (!editing?.rung) return;
    setRungs(rungs.filter((r) => r !== editing.rung));
    setEditing(null);
  }

  const activeRung = activeId ? rungs.find((r) => r.id === activeId) ?? null : null;

  const bands = BAND_ORDER.map((band) => (
    <BandLane
      key={band}
      band={band}
      rungs={rungs.filter((r) => (r.band ?? "need") === band)}
      oneOhMoment={ladder.oneOhMoment}
      interactive={mounted}
      onEdit={(rung) => setEditing({ rung, band })}
      onAdd={() => setEditing({ rung: null, band })}
    />
  ));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        {ladder.coreRelease && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs text-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: PORTAL_COLOR }}
            />
            {ladder.coreRelease.label}
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted">
          Drag to reorder · click ✎ to edit · saves automatically
        </span>
        <SaveDot state={saving} />
      </div>

      {/* App / Portal column key */}
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
          <div className="max-w-3xl">{bands}</div>
          <DragOverlay dropAnimation={null}>
            {activeRung ? <RungCard rung={activeRung} overlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="max-w-3xl">{bands}</div>
      )}

      {editing && (
        <RungEditor
          key={editing.rung?.id ?? "new"}
          initial={editing.rung}
          band={editing.band}
          onSave={saveRung}
          onDelete={editing.rung ? deleteRung : undefined}
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

function BandLane({
  band,
  rungs,
  oneOhMoment,
  interactive,
  onEdit,
  onAdd,
}: {
  band: Band;
  rungs: Rung[];
  oneOhMoment: OneOhMoment | null;
  interactive: boolean;
  onEdit: (rung: Rung) => void;
  onAdd: () => void;
}) {
  const meta = BAND_META[band];
  const { setNodeRef, isOver } = useDroppable({ id: `band:${band}` });

  const list = (
    <div
      ref={interactive ? setNodeRef : undefined}
      className={`flex flex-col gap-2.5 rounded-xl p-1 transition-colors ${
        interactive && isOver ? "bg-white/[0.03]" : ""
      }`}
    >
      {rungs.map((rung) => (
        <Fragment key={rung.id}>
          {interactive ? (
            <SortableRung rung={rung} onEdit={() => onEdit(rung)} />
          ) : (
            <RungCard rung={rung} />
          )}
          {oneOhMoment && rung.id === oneOhMoment.after && (
            <OneOhMarker moment={oneOhMoment} />
          )}
        </Fragment>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg border border-dashed border-border py-1.5 text-[12px] text-muted transition hover:border-border-strong hover:text-foreground"
      >
        + Add rung
      </button>
    </div>
  );

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline gap-2">
        <span
          className="h-2.5 w-2.5 translate-y-[1px] rounded-full"
          style={{ backgroundColor: meta.color }}
        />
        <h2 className="text-sm font-semibold tracking-tight">{meta.label}</h2>
        {meta.sub && <span className="text-xs text-muted">· {meta.sub}</span>}
      </div>
      {interactive ? (
        <SortableContext
          items={rungs.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {list}
        </SortableContext>
      ) : (
        list
      )}
    </section>
  );
}

function SortableRung({ rung, onEdit }: { rung: Rung; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rung.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <RungCard rung={rung} onEdit={onEdit} />
    </div>
  );
}

function CrosswalkLine({ side, text }: { side: "app" | "portal"; text: string }) {
  const muted = isMuted(text);
  const color = side === "app" ? APP_COLOR : PORTAL_COLOR;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: muted ? "var(--border-strong)" : color }}
      />
      <span
        className={`text-[11.5px] leading-snug ${muted ? "text-muted/60" : "text-muted-strong"}`}
      >
        {text}
      </span>
    </div>
  );
}

function RungCard({
  rung,
  overlay,
  onEdit,
}: {
  rung: Rung;
  overlay?: boolean;
  onEdit?: () => void;
}) {
  const st = RUNG_STATUS[rung.status];
  return (
    <article
      className={`group/rung relative select-none rounded-xl border border-border bg-surface-elevated p-3 ${
        overlay
          ? "rotate-[1deg] shadow-2xl shadow-black/60 ring-1 ring-white/10"
          : onEdit
            ? "cursor-grab touch-none transition-colors hover:border-white/15 hover:bg-[#202023] active:cursor-grabbing"
            : ""
      }`}
      style={{ borderLeft: `3px solid ${st.color}` }}
    >
      {onEdit && (
        <button
          type="button"
          aria-label="Edit rung"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-white/10 hover:text-foreground group-hover/rung:opacity-100"
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
      )}
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[12px] font-semibold text-muted-strong">
          {rung.id}
        </span>
        <span className="flex-1 pr-5 text-[13px] font-medium leading-snug text-foreground">
          {rung.name}
        </span>
        <span
          className="pill shrink-0"
          style={{ color: st.color, backgroundColor: `${st.color}1f` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st.color }} />
          {st.label}
        </span>
      </div>
      {rung.scope && (
        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-muted">
          {rung.scope}
        </p>
      )}
      {(rung.app || rung.portal) && (
        <div className="mt-2 flex flex-col gap-1 border-t border-border/60 pt-2">
          {rung.app && <CrosswalkLine side="app" text={rung.app} />}
          {rung.portal && <CrosswalkLine side="portal" text={rung.portal} />}
        </div>
      )}
    </article>
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

// --- Edit modal ------------------------------------------------------------
const FIELD =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-white/25";
const LABEL = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted";

function RungEditor({
  initial,
  band: initialBand,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Rung | null;
  band: Band;
  onSave: (rung: Rung) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [id, setId] = useState(initial?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [scope, setScope] = useState(initial?.scope ?? "");
  const [status, setStatus] = useState<RungStatus>(initial?.status ?? "planned");
  const [band, setBand] = useState<Band>(initial?.band ?? initialBand);
  const [runsOn, setRunsOn] = useState<string[]>(initial?.runsOn ?? []);
  const [app, setApp] = useState(initial?.app ?? "");
  const [portal, setPortal] = useState(initial?.portal ?? "");

  function toggleRunsOn(v: string) {
    setRunsOn((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanId = id.trim();
    const cleanName = name.trim();
    if (!cleanId || !cleanName) return;
    const next: Rung = {
      id: cleanId,
      name: cleanName,
      scope: scope.trim(),
      runsOn,
      status,
      band,
      ...(app.trim() ? { app: app.trim() } : {}),
      ...(portal.trim() ? { portal: portal.trim() } : {}),
      ...(initial?.steps ? { steps: initial.steps } : {}),
    };
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-5"
      >
        <h3 className="mb-4 text-sm font-semibold">
          {initial ? `Edit ${initial.id}` : "New rung"}
        </h3>

        <div className="grid grid-cols-[90px_1fr] gap-2">
          <div>
            <label className={LABEL}>M-id</label>
            <input
              autoFocus={!initial}
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="M8"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hub + Credits"
              className={FIELD}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className={LABEL}>Scope</label>
          <textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            rows={3}
            placeholder="What ships at this rung"
            className={FIELD}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RungStatus)}
              className={FIELD}
            >
              {(Object.keys(RUNG_STATUS) as RungStatus[]).map((s) => (
                <option key={s} value={s}>
                  {RUNG_STATUS[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Band</label>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value as Band)}
              className={FIELD}
            >
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

        <div className="mt-3">
          <label className={LABEL}>
            <span style={{ color: APP_COLOR }}>App</span> surface
          </label>
          <input
            value={app}
            onChange={(e) => setApp(e.target.value)}
            placeholder="App surface at this rung"
            className={FIELD}
          />
        </div>
        <div className="mt-3">
          <label className={LABEL}>
            <span style={{ color: PORTAL_COLOR }}>Portal</span> surface
          </label>
          <input
            value={portal}
            onChange={(e) => setPortal(e.target.value)}
            placeholder="Portal surface at this rung"
            className={FIELD}
          />
        </div>

        {initial?.steps && initial.steps.length > 0 && (
          <p className="mt-3 text-[11px] text-muted">
            This rung also has {initial.steps.length} granular step
            {initial.steps.length === 1 ? "" : "s"} (kept as-is; edit the App /
            Portal summary above).
          </p>
        )}

        <div className="mt-5 flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-border px-3 py-2 text-sm text-accent-pink transition-colors hover:border-accent-pink/40"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!id.trim() || !name.trim()}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
