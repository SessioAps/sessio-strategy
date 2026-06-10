"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  type DragOverEvent,
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
  AREA_ORDER,
  AREAS,
  STATUS_META,
  TIME_META,
  TIMES,
  cellId,
  emptyBoard,
  parseCell,
  type Area,
  type Board,
  type Card,
  type CellId,
  type Status,
} from "@/app/lib/roadmap";
import Link from "next/link";
import { DateChip, OwnerChip, StatusPill } from "@/app/components/ui";

type EditTarget = { cell: CellId; card: Card | null };

function findCell(board: Board, id: string): CellId | null {
  if (id in board) return id as CellId;
  for (const key of Object.keys(board) as CellId[]) {
    if (board[key].some((c) => c.id === id)) return key;
  }
  return null;
}

function findCard(board: Board, id: string): Card | null {
  for (const key of Object.keys(board) as CellId[]) {
    const hit = board[key].find((c) => c.id === id);
    if (hit) return hit;
  }
  return null;
}

export default function RoadmapBoard({ initialBoard }: { initialBoard: Board }) {
  const [board, setBoard] = useState<Board>(() => ({ ...emptyBoard(), ...initialBoard }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Set<Area>>(new Set());
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [mounted, setMounted] = useState(false);
  const firstSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Persist to the shared store (debounced) whenever the board changes.
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/board", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(board),
      }).catch(() => {
        /* offline / save hiccup — non-fatal, local state stays correct */
      });
    }, 500);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findCell(board, String(active.id));
    const to = findCell(board, String(over.id));
    if (!from || !to || from === to) return;

    setBoard((prev) => {
      const fromItems = prev[from];
      const toItems = prev[to];
      const idx = fromItems.findIndex((c) => c.id === active.id);
      if (idx === -1) return prev;
      const moved = fromItems[idx];

      const overIsCell = String(over.id) in prev;
      let insertAt = toItems.length;
      if (!overIsCell) {
        const overIndex = toItems.findIndex((c) => c.id === over.id);
        if (overIndex !== -1) insertAt = overIndex;
      }

      return {
        ...prev,
        [from]: fromItems.filter((c) => c.id !== active.id),
        [to]: [...toItems.slice(0, insertAt), moved, ...toItems.slice(insertAt)],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const cell = findCell(board, String(active.id));
    const overCell = findCell(board, String(over.id));
    if (!cell || !overCell || cell !== overCell) return;

    const items = board[cell];
    const oldIndex = items.findIndex((c) => c.id === active.id);
    const newIndex = items.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    setBoard((prev) => ({ ...prev, [cell]: arrayMove(prev[cell], oldIndex, newIndex) }));
  }

  // --- Editing --------------------------------------------------------------
  function saveCard(cell: CellId, card: Card) {
    setBoard((prev) => {
      const items = prev[cell] ?? [];
      const exists = items.some((c) => c.id === card.id);
      const next = exists
        ? items.map((c) => (c.id === card.id ? card : c))
        : [...items, card];
      return { ...prev, [cell]: next };
    });
    setEditing(null);
  }

  function deleteCard(id: string) {
    setBoard((prev) => {
      const cell = findCell(prev, id);
      if (!cell) return prev;
      return { ...prev, [cell]: prev[cell].filter((c) => c.id !== id) };
    });
    setEditing(null);
  }

  const visibleAreas = useMemo(
    () => (filter.size === 0 ? AREA_ORDER : AREA_ORDER.filter((a) => filter.has(a))),
    [filter],
  );

  function toggleArea(a: Area) {
    setFilter((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  }

  const activeCard = activeId ? findCard(board, activeId) : null;
  const activeColor = activeId
    ? AREAS[parseCell(findCell(board, activeId) ?? "strategy::now").area].color
    : "#ffffff";

  const rows = visibleAreas.map((area) => (
    <Fragment key={area}>
      <AreaLabel area={area} />
      {TIMES.map((time) => {
        const id = cellId(area, time);
        const color = AREAS[area].color;
        const cards = board[id];
        return mounted ? (
          <Cell
            key={id}
            id={id}
            color={color}
            cards={cards}
            onEdit={(card) => setEditing({ cell: id, card })}
            onAdd={() => setEditing({ cell: id, card: null })}
          />
        ) : (
          <StaticCell key={id} color={color} cards={cards} />
        );
      })}
    </Fragment>
  ));

  const grid = (
    <div className="overflow-x-auto">
      <div className="grid min-w-[920px] grid-cols-[170px_repeat(3,minmax(0,1fr))] overflow-hidden rounded-xl border-l border-t border-border">
        <div className="border-b border-r border-border bg-surface/60" />
        {TIMES.map((t) => (
          <div
            key={t}
            className="flex items-baseline gap-2 border-b border-r border-border bg-surface/60 px-4 py-3"
          >
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {TIME_META[t].label}
            </span>
            <span className="col-label">{TIME_META[t].sub}</span>
          </div>
        ))}
        {rows}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterChip
          label="All areas"
          active={filter.size === 0}
          onClick={() => setFilter(new Set())}
        />
        <span className="mx-1 h-4 w-px bg-border" />
        {AREA_ORDER.map((a) => (
          <FilterChip
            key={a}
            label={AREAS[a].label}
            color={AREAS[a].color}
            active={filter.size === 0 || filter.has(a)}
            dimmed={filter.size > 0 && !filter.has(a)}
            onClick={() => toggleArea(a)}
          />
        ))}
      </div>

      {mounted ? (
        <DndContext
          id="sessio-roadmap-dnd"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {grid}
          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <CardView card={activeCard} color={activeColor} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        grid
      )}

      {editing && (
        <CardEditor
          key={editing.card?.id ?? "new"}
          initial={editing.card}
          color={AREAS[parseCell(editing.cell).area].color}
          areaLabel={AREAS[parseCell(editing.cell).area].label}
          timeLabel={TIME_META[parseCell(editing.cell).time].label}
          onSave={(card) => saveCard(editing.cell, card)}
          onDelete={editing.card ? () => deleteCard(editing.card!.id) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  color,
  active,
  dimmed,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  dimmed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-white/20 bg-white/[0.06] text-foreground"
          : "border-border text-muted hover:text-foreground"
      } ${dimmed ? "opacity-45" : ""}`}
    >
      {color && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
    </button>
  );
}

function AreaLabel({ area }: { area: Area }) {
  const meta = AREAS[area];
  return (
    <Link
      href={`/division/${area}`}
      className="group flex items-center gap-2.5 border-b border-r border-border bg-surface/30 px-4 py-3 transition-colors hover:bg-white/[0.04]"
      style={{ boxShadow: `inset 3px 0 0 ${meta.color}` }}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      <span className="text-sm font-medium leading-tight text-foreground">
        {meta.label}
      </span>
      <span className="ml-auto text-muted opacity-0 transition-opacity group-hover:opacity-100">
        →
      </span>
    </Link>
  );
}

const cellClass =
  "group/cell flex min-h-[88px] flex-col gap-2 border-b border-r border-border p-2.5 transition-colors";

function Cell({
  id,
  color,
  cards,
  onEdit,
  onAdd,
}: {
  id: CellId;
  color: string;
  cards: Card[];
  onEdit: (card: Card) => void;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={`${cellClass} ${isOver ? "bg-white/[0.04]" : ""}`}>
        {cards.map((card) => (
          <SortableCard key={card.id} card={card} color={color} onEdit={onEdit} />
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="mt-auto rounded-md border border-dashed border-border py-1 text-[11px] text-muted opacity-0 transition hover:border-border-strong hover:text-foreground group-hover/cell:opacity-100"
        >
          + Add
        </button>
      </div>
    </SortableContext>
  );
}

function StaticCell({ color, cards }: { color: string; cards: Card[] }) {
  return (
    <div className={cellClass}>
      {cards.map((card) => (
        <CardView key={card.id} card={card} color={color} />
      ))}
    </div>
  );
}

function SortableCard({
  card,
  color,
  onEdit,
}: {
  card: Card;
  color: string;
  onEdit: (card: Card) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardView card={card} color={color} onEdit={() => onEdit(card)} />
    </div>
  );
}

function CardView({
  card,
  color,
  overlay,
  onEdit,
}: {
  card: Card;
  color: string;
  overlay?: boolean;
  onEdit?: () => void;
}) {
  return (
    <article
      className={`group/card relative cursor-grab touch-none select-none rounded-lg border border-border bg-surface-elevated p-2.5 active:cursor-grabbing ${
        overlay
          ? "rotate-[1.5deg] shadow-2xl shadow-black/60 ring-1 ring-white/10"
          : "transition-colors hover:border-white/15 hover:bg-[#202023]"
      }`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {onEdit && (
        <button
          type="button"
          aria-label="Edit card"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition hover:bg-white/10 hover:text-foreground group-hover/card:opacity-100"
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
      <p className="pr-5 text-[13px] font-medium leading-snug text-foreground">
        {card.title}
      </p>
      {card.note && (
        <p className="mt-1 text-[11.5px] leading-snug text-muted">{card.note}</p>
      )}
      {(card.status || card.date || card.owner) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusPill status={card.status} />
          <DateChip date={card.date} />
          <OwnerChip owner={card.owner} />
        </div>
      )}
    </article>
  );
}

const FIELD =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-white/25";
const LABEL = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted";

function CardEditor({
  initial,
  color,
  areaLabel,
  timeLabel,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Card | null;
  color: string;
  areaLabel: string;
  timeLabel: string;
  onSave: (card: Card) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [status, setStatus] = useState<Status | "">(initial?.status ?? "");
  const [owner, setOwner] = useState(initial?.owner ?? "");
  const [date, setDate] = useState(initial?.date ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const card: Card = {
      id: initial?.id ?? crypto.randomUUID(),
      title: t,
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(detail.trim() ? { detail: detail.trim() } : {}),
      ...(status ? { status } : {}),
      ...(owner.trim() ? { owner: owner.trim() } : {}),
      ...(date.trim() ? { date: date.trim() } : {}),
    };
    onSave(card);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-muted">
            {areaLabel} · {timeLabel}
          </span>
          <h3 className="ml-auto text-sm font-semibold">
            {initial ? "Edit card" : "New card"}
          </h3>
        </div>

        <label className={LABEL}>Title</label>
        <textarea
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={2}
          placeholder="What is it?"
          className={FIELD}
        />

        <div className="mt-3">
          <label className={LABEL}>Note (one line)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Short subtitle"
            className={FIELD}
          />
        </div>

        <div className="mt-3">
          <label className={LABEL}>Detail (shown on the division page)</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={2}
            placeholder="Longer description (optional)"
            className={FIELD}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <label className={LABEL}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status | "")}
              className={FIELD}
            >
              <option value="">—</option>
              {(Object.keys(STATUS_META) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Owner</label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Name"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Date</label>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="25 Jun"
              className={FIELD}
            />
          </div>
        </div>

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
            disabled={!title.trim()}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
