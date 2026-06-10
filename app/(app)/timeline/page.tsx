import TimeScale from "@/app/components/TimeScale";
import { getEvents } from "@/app/lib/store";

export const dynamic = "force-dynamic";

const ZOOMS = ["day", "week", "month", "year", "years5"] as const;
type Zoom = (typeof ZOOMS)[number];

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ zoom?: string }>;
}) {
  const { zoom } = await searchParams;
  const initialZoom: Zoom | undefined = ZOOMS.includes(zoom as Zoom)
    ? (zoom as Zoom)
    : undefined;
  const events = await getEvents();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-7 border-b border-border pb-6">
        <p className="eyebrow mb-2">Timeline</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          The road ahead, at every zoom
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Day to day when you need the detail, out to the 5-year horizon when you
          need the direction. Strategy milestones + the hello@sessio.io calendar,
          color-coded by sector.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="max-w-2xl rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted">
          No dated events loaded yet — they live in the private store.
        </p>
      ) : (
        <TimeScale milestones={events} initialZoom={initialZoom} />
      )}
    </div>
  );
}
