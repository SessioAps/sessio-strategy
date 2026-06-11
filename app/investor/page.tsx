import { cookies } from "next/headers";
import { AUTH_COOKIE, roleForCookie } from "@/app/lib/auth";
import { getEvents, getInvestorBoard, getLadder } from "@/app/lib/store";
import PostUpdate from "./PostUpdate";

export const dynamic = "force-dynamic";

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d ?? 1);
}

export default async function InvestorPage() {
  const jar = await cookies();
  const role = await roleForCookie(
    jar.get(AUTH_COOKIE)?.value,
    process.env.ROADMAP_PASSWORD,
    process.env.ROADMAP_INVESTOR_PASSWORD,
  );
  const isTeam = role === "team";

  const [board, events, ladder] = await Promise.all([
    getInvestorBoard(),
    getEvents(),
    getLadder(),
  ]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Auto, investor-safe highlights from the roadmap — no internal detail.
  const wins = events.filter((e) => e.status === "done").slice(-4).reverse();
  const next = events
    .filter((e) => parseISO(e.isoEnd ?? e.iso) >= today && e.status !== "done")
    .slice(0, 5);
  const shipped = ladder.rungs.filter((r) => r.status === "shipped").length;
  const building = ladder.rungs.find((r) => r.status === "building");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      {isTeam && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-dashed border-border-strong bg-surface/40 px-4 py-2.5">
          <p className="text-[12px] text-muted">
            Team preview — this is what investors see. Investors can reach <span className="text-foreground">only</span> this page.
          </p>
          <PostUpdate />
        </div>
      )}

      {/* Letterhead */}
      <header className="border-b border-border pb-7">
        <p className="eyebrow mb-2">Sessio · Investor update</p>
        <h1 className="text-3xl font-semibold tracking-tight">Where we are</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-strong">
          {board.intro ??
            "Building the operating system for the music industry — proven from Denmark out. Here's the latest, and the room with the numbers."}
        </p>
      </header>

      {/* Product pulse — safe, high-level */}
      {ladder.rungs.length > 0 && (
        <section className="mt-7">
          <div className="flex items-end gap-1">
            {ladder.rungs.map((r) => (
              <div
                key={r.id}
                title={`${r.id} — ${r.name}`}
                className="h-6 flex-1 rounded-sm"
                style={{ backgroundColor: r.status === "shipped" ? "#3ed4b1" : r.status === "building" ? "#2563eb" : "#2a2a2e" }}
              />
            ))}
          </div>
          <p className="mt-2.5 text-[13px] text-muted-strong">
            {shipped} of {ladder.rungs.length} product milestones shipped
            {building ? <> · now building <span className="font-medium text-foreground">{building.name}</span></> : null}
          </p>
        </section>
      )}

      {/* Recent wins + what's next */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/40 p-4">
          <p className="eyebrow mb-3">Recent wins</p>
          <ul className="flex flex-col gap-2">
            {wins.map((w) => (
              <li key={w.id} className="text-[13px]">
                <span className="text-accent-green">●</span> <span className="text-foreground">{w.title}</span>
                <span className="ml-1 text-[11px] text-muted">· {w.date}</span>
              </li>
            ))}
            {wins.length === 0 && <li className="text-[13px] text-muted">—</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-surface/40 p-4">
          <p className="eyebrow mb-3">What's next</p>
          <ul className="flex flex-col gap-2">
            {next.map((n) => (
              <li key={n.id} className="text-[13px]">
                <span className="text-muted">○</span> <span className="text-foreground">{n.title}</span>
                <span className="ml-1 text-[11px] text-muted">· {n.date}</span>
              </li>
            ))}
            {next.length === 0 && <li className="text-[13px] text-muted">—</li>}
          </ul>
        </div>
      </section>

      {/* Updates feed */}
      <section className="mt-9">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Updates</h2>
        {board.updates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted">
            No updates posted yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {board.updates.map((u) => (
              <article key={u.id} className="rounded-2xl border border-border bg-surface-elevated p-5">
                <div className="mb-1.5 flex items-center gap-2">
                  {u.tag && <span className="pill border border-border text-muted">{u.tag}</span>}
                  <span className="ml-auto text-[11px] text-muted">{u.date}</span>
                </div>
                <h3 className="text-[15px] font-semibold">{u.title}</h3>
                {u.body && <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-muted-strong">{u.body}</p>}
              </article>
            ))}
          </ol>
        )}
      </section>

      {/* Data room — access-controlled; the board never holds the numbers */}
      <section className="mt-9 rounded-2xl border border-border bg-surface/40 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Data room</h2>
          <span className="text-[11px] text-muted">Access granted individually</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          The cap table and shareholders&apos; agreement live in our secured SharePoint, permissioned per investor. If a link asks you to request access, that&apos;s expected — we approve it to you directly.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {board.dataRoom.map((d) => (
            <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer"
               className="group flex flex-col rounded-xl border border-border bg-surface-elevated p-3.5 transition-colors hover:border-border-strong">
              <span className="text-[13.5px] font-medium text-foreground">🔒 {d.label}</span>
              {d.note && <span className="mt-0.5 text-[11.5px] text-muted">{d.note}</span>}
            </a>
          ))}
          {board.dataRoom.length === 0 && <p className="text-[13px] text-muted">No documents linked yet.</p>}
        </div>
      </section>

      <footer className="mt-10 border-t border-border pt-5 text-[11px] text-muted">
        Confidential — for Sessio investors. Please don&apos;t forward.
      </footer>
    </div>
  );
}
