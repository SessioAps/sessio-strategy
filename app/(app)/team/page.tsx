import { getTeam } from "@/app/lib/store";
import AddMember from "./AddMember";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6 border-b border-border pb-6">
        <p className="eyebrow mb-2">Team</p>
        <h1 className="text-2xl font-semibold tracking-tight">The people building Sessio</h1>
        <p className="mt-1.5 text-sm text-muted">Copenhagen, founded 2025.</p>
      </header>

      <AddMember />

      <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {team.map((m) => (
          <article key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-[12px] font-semibold text-muted-strong">
              {initials(m.name)}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold">{m.name}</p>
              {m.role ? (
                <p className="text-[12px] text-muted-strong">{m.role}</p>
              ) : (
                <p className="text-[12px] text-muted/60 italic">role tbd</p>
              )}
              <div className="mt-0.5 flex gap-2 text-[11px]">
                {m.email && <a href={`mailto:${m.email}`} className="text-muted underline-offset-4 hover:text-foreground hover:underline">{m.email}</a>}
                {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted underline-offset-4 hover:text-foreground hover:underline">LinkedIn</a>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
