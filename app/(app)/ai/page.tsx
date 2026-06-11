import { getAiItems } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export default async function AiHubPage() {
  const items = await getAiItems();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6 border-b border-border pb-6">
        <p className="eyebrow mb-2">AI hub</p>
        <h1 className="text-2xl font-semibold tracking-tight">Where it&apos;s all going</h1>
      </header>

      <div className="flex max-w-3xl flex-col gap-2.5">
        {items.map((it) => (
          <article key={it.id} className="rounded-xl border border-border bg-surface-elevated p-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-semibold leading-snug">{it.headline}</h2>
              <span className="ml-auto shrink-0 text-[10px] text-muted">{it.source}{it.date ? ` · ${it.date}` : ""}</span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-strong">{it.take}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
