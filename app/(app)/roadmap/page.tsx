import RoadmapBoard from "@/app/components/RoadmapBoard";
import { getBoard } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const initialBoard = await getBoard();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-7 border-b border-border pb-6">
        <p className="eyebrow mb-2">Roadmap</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          The whole strategy, at a glance
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Divisions down the side, time across the top. Drag a card to move it,
          filter to focus on one area, or open a division for the full detail.
        </p>
      </header>

      <RoadmapBoard initialBoard={initialBoard} />
    </div>
  );
}
