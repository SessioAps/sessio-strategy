import LadderEditor from "@/app/components/LadderEditor";
import { getLadder } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export default async function LadderPage() {
  const ladder = await getLadder();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-7 border-b border-border pb-6">
        <p className="eyebrow mb-2">Product roadmap</p>
        <h1 className="text-2xl font-semibold tracking-tight">The M-ladder</h1>
      </header>

      {ladder.rungs.length === 0 ? (
        <p className="max-w-2xl rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted">
          No ladder loaded yet — it lives in the private store.
        </p>
      ) : (
        <LadderEditor initialLadder={ladder} />
      )}
    </div>
  );
}
