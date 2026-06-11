"use client";

import { useState } from "react";
import RoadmapBoard from "@/app/components/RoadmapBoard";
import TimeScale from "@/app/components/TimeScale";
import type { Board, Milestone } from "@/app/lib/roadmap";

// One roadmap, two lenses: by sector (board, draggable) or by time (zoomable).
type View = "board" | "time";
type Zoom = "day" | "week" | "month" | "year" | "years5";

const TIME_JUMPS: { label: string; zoom: Zoom }[] = [
  { label: "Tomorrow", zoom: "day" },
  { label: "This week", zoom: "week" },
  { label: "This month", zoom: "month" },
  { label: "This year", zoom: "year" },
  { label: "5 years", zoom: "years5" },
];

export default function RoadmapViews({
  initialBoard,
  events,
  initialView,
  initialZoom,
}: {
  initialBoard: Board;
  events: Milestone[];
  initialView?: View;
  initialZoom?: Zoom;
}) {
  const [view, setView] = useState<View>(initialView ?? "board");
  const [zoom, setZoom] = useState<Zoom | undefined>(initialZoom);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="flex gap-1 rounded-xl border border-border-strong bg-surface p-1">
          {(["board", "time"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                view === v
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-white/[0.06] hover:text-foreground"
              }`}
            >
              {v === "board" ? "By sector" : "By time"}
            </button>
          ))}
        </div>
        <span className="h-4 w-px bg-border" />
        <span className="text-[11px] text-muted">Jump:</span>
        {TIME_JUMPS.map((j) => (
          <button
            key={j.zoom}
            type="button"
            onClick={() => {
              setZoom(j.zoom);
              setView("time");
            }}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            {j.label}
          </button>
        ))}
      </div>

      {view === "board" ? (
        <RoadmapBoard initialBoard={initialBoard} />
      ) : (
        <TimeScale key={zoom ?? "default"} milestones={events} initialZoom={zoom} />
      )}
    </div>
  );
}
