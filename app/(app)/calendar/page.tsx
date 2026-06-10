import CalendarView from "@/app/components/CalendarView";
import { getEvents } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const milestones = await getEvents();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-7 border-b border-border pb-6">
        <p className="eyebrow mb-2">Calendar</p>
        <h1 className="text-2xl font-semibold tracking-tight">Week by week</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Slide through the weeks to see what&apos;s happening and when.
        </p>
      </header>

      <CalendarView milestones={milestones} />
    </div>
  );
}
