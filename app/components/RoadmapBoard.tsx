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
  TIME_META,
  TIMES,
  cellId,
  emptyBoard,
  parseCell,
  type Area,
  type Board,
  type Card,
  type CellId,
} from "@/app/lib/roadmap";
import Link from "next/link";
import { DateChip, OwnerChip, StatusPill } from "@/app/components/ui";

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
  // Merge over an empty board so every cell exists even if a stored board
  // predates a structural change.
  const [board, setBoard] = useState<Board>(() => ({ ...emptyBoard(), ...initialBoard }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Set<Area>>(new Set());
  // Drag is enabled only after mount. The server + first client render show a
  // static grid, so hydration matches; dnd-kit (which generates non-deterministic
  // aria ids) is mounted afterwards.
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
          <Cell key={id} id={id} color={color} cards={cards} />
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
  "flex min-h-[88px] flex-col gap-2 border-b border-r border-border p-2.5 transition-colors";

function Cell({ id, color, cards }: { id: CellId; color: string; cards: Card[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={`${cellClass} ${isOver ? "bg-white/[0.04]" : ""}`}>
        {cards.map((card) => (
          <SortableCard key={card.id} card={card} color={color} />
        ))}
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

function SortableCard({ card, color }: { card: Card; color: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardView card={card} color={color} />
    </div>
  );
}

function CardView({
  card,
  color,
  overlay,
}: {
  card: Card;
  color: string;
  overlay?: boolean;
}) {
  return (
    <article
      className={`cursor-grab touch-none select-none rounded-lg border border-border bg-surface-elevated p-2.5 active:cursor-grabbing ${
        overlay
          ? "rotate-[1.5deg] shadow-2xl shadow-black/60 ring-1 ring-white/10"
          : "transition-colors hover:border-white/15 hover:bg-[#202023]"
      }`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <p className="text-[13px] font-medium leading-snug text-foreground">
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
