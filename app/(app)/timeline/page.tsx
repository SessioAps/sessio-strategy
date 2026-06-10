import TimeScale from "@/app/components/TimeScale";
import { getMilestones } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const milestones = await getMilestones();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-7 border-b border-border pb-6">
        <p className="eyebrow mb-2">Timeline</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          The road ahead, at every zoom
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Day to day when you need the detail, out to the 5-year horizon when you
          need the direction. Color-coded by sector.
        </p>
      </header>

      {milestones.length === 0 ? (
        <p className="max-w-2xl rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted">
          No dated milestones loaded yet — they live in the private store.
        </p>
      ) : (
        <TimeScale milestones={milestones} />
      )}
    </div>
  );
}
