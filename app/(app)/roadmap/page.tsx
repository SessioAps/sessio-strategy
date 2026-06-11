import RoadmapViews from "@/app/components/RoadmapViews";
import { getBoard, getEvents } from "@/app/lib/store";

export const dynamic = "force-dynamic";

const ZOOMS = ["day", "week", "month", "year", "years5"] as const;
type Zoom = (typeof ZOOMS)[number];

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; zoom?: string }>;
}) {
  const { view, zoom } = await searchParams;
  const initialZoom: Zoom | undefined = ZOOMS.includes(zoom as Zoom)
    ? (zoom as Zoom)
    : undefined;
  const initialView = view === "time" || initialZoom ? ("time" as const) : undefined;
  const [initialBoard, events] = await Promise.all([getBoard(), getEvents()]);

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6 border-b border-border pb-6">
        <p className="eyebrow mb-2">Roadmap</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          One plan, two lenses
        </h1>
      </header>

      <RoadmapViews
        initialBoard={initialBoard}
        events={events}
        initialView={initialView}
        initialZoom={initialZoom}
      />
    </div>
  );
}
