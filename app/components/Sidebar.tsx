"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AREA_ORDER, AREAS, type Area } from "@/app/lib/roadmap";

const DIVISIONS: Area[] = AREA_ORDER.filter((a) => a !== "milestones");

const TOP = [
  { href: "/", label: "Home" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/ladder", label: "Product ladder" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-black/40 px-4 py-6 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
        <span className="text-base font-semibold tracking-tight">Sessio</span>
        <span className="h-3.5 w-px bg-border" />
        <span className="text-base font-semibold tracking-tight text-muted-strong">
          Strategy
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {TOP.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            }
          />
        ))}

        <div className="eyebrow mt-6 mb-1.5 px-3">Divisions</div>
        {DIVISIONS.map((a) => (
          <NavLink
            key={a}
            href={`/division/${a}`}
            label={AREAS[a].label}
            color={AREAS[a].color}
            active={pathname === `/division/${a}`}
          />
        ))}
      </nav>

    </aside>
  );
}

function NavLink({
  href,
  label,
  color,
  active,
}: {
  href: string;
  label: string;
  color?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-white/[0.07] font-medium text-foreground"
          : "text-muted hover:bg-white/[0.03] hover:text-foreground"
      }`}
    >
      {color ? (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      ) : (
        <span
          className={`h-1.5 w-1.5 rounded-full ${active ? "bg-foreground" : "bg-muted"}`}
        />
      )}
      {label}
    </Link>
  );
}
