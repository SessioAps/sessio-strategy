"use client";

import { useState } from "react";
import type { Card } from "@/app/lib/roadmap";
import { DateChip, OwnerChip, StatusPill } from "@/app/components/ui";

// Zoom level 2: a sector-page initiative. Collapsed = scannable one-liner;
// click to expand the full detail.
export default function InitiativeCard({ card, color }: { card: Card; color: string }) {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(card.detail || card.note);

  return (
    <article
      className={`rounded-xl border border-border bg-surface-elevated transition-colors ${
        expandable ? "cursor-pointer hover:border-white/15" : ""
      }`}
      style={{ borderLeft: `3px solid ${color}` }}
      onClick={expandable ? () => setOpen((v) => !v) : undefined}
    >
      <div className="flex items-start gap-2 p-3.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-medium leading-snug">{card.title}</h3>
          {!open && card.note && (
            <p className="mt-0.5 truncate text-[12px] text-muted">{card.note}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={card.status} />
          <DateChip date={card.date} />
          {expandable && (
            <span
              className={`text-muted transition-transform ${open ? "rotate-90" : ""}`}
              aria-hidden
            >
              ›
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 px-3.5 py-3">
          {card.note && (
            <p className="text-[13px] leading-relaxed text-muted-strong">{card.note}</p>
          )}
          {card.detail && (
            <p className={`text-[13px] leading-relaxed text-muted ${card.note ? "mt-1.5" : ""}`}>
              {card.detail}
            </p>
          )}
          {card.owner && (
            <div className="mt-2.5">
              <OwnerChip owner={card.owner} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
