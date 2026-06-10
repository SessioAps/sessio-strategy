import Link from "next/link";
import RoadmapBoard from "@/app/components/RoadmapBoard";
import { getBoard } from "@/app/lib/store";

export const dynamic = "force-dynamic";

// Jump anywhere in time from the board: straight into the right timeline zoom,
// or to the visions on the sector pages via Home.
const TIME_JUMPS = [
  { label: "Tomorrow", href: "/timeline?zoom=day" },
  { label: "This week", href: "/timeline?zoom=week" },
  { label: "This month", href: "/timeline?zoom=month" },
  { label: "This year", href: "/timeline?zoom=year" },
  { label: "5 years", href: "/timeline?zoom=years5" },
  { label: "◆ The vision", href: "/" },
];

export default async function RoadmapPage() {
  const initialBoard = await getBoard();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6 border-b border-border pb-6">
        <p className="eyebrow mb-2">Roadmap</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          The whole strategy, at a glance
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Divisions down the side, time across the top. Drag a card to move it,
          click to edit, or open a division for the full journey.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] text-muted">Jump in time:</span>
          {TIME_JUMPS.map((j) => (
            <Link
              key={j.label}
              href={j.href}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground"
            >
              {j.label}
            </Link>
          ))}
        </div>
      </header>

      <RoadmapBoard initialBoard={initialBoard} />
    </div>
  );
}
