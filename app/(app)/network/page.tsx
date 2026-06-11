import { getNetwork } from "@/app/lib/store";
import AddContact from "./AddContact";

export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const contacts = await getNetwork();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6 border-b border-border pb-6">
        <p className="eyebrow mb-2">Network</p>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
      </header>

      <AddContact />

      <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {contacts.map((c) => (
          <article key={c.id} className="rounded-xl border border-border bg-surface-elevated p-3.5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[14px] font-semibold">{c.name}</h2>
              {c.org && <span className="text-[12px] text-muted">{c.org}</span>}
            </div>
            {c.role && <p className="mt-0.5 text-[12px] text-muted-strong">{c.role}</p>}
            {(c.email || c.phone) && (
              <p className="mt-1 text-[12px]">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="text-muted underline-offset-4 hover:text-foreground hover:underline">{c.email}</a>
                )}
                {c.email && c.phone && <span className="text-muted"> · </span>}
                {c.phone && <span className="text-muted">{c.phone}</span>}
              </p>
            )}
            {c.note && <p className="mt-1.5 text-[12px] leading-snug text-muted">{c.note}</p>}
            {(c.tags?.length ?? 0) > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.tags!.map((t) => (
                  <span key={t} className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted">{t}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
