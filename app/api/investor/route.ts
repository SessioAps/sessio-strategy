import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, roleForCookie } from "@/app/lib/auth";
import { addInvestorUpdate, appendChange } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Only the team may post. Investor-role cookies are rejected here too, not
  // just at the middleware.
  const jar = await cookies();
  const role = await roleForCookie(
    jar.get(AUTH_COOKIE)?.value,
    process.env.ROADMAP_PASSWORD,
    process.env.ROADMAP_INVESTOR_PASSWORD,
  );
  if (role !== "team") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { title?: string; body?: string; tag?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  await addInvestorUpdate({
    id: `iu-${Date.now().toString(36)}`,
    date,
    title,
    body: (body.body ?? "").trim(),
    tag: body.tag?.trim() || undefined,
  });
  await appendChange({ at: now.toISOString(), kind: "event", summary: `Investor update posted: ${title}` });
  return NextResponse.json({ ok: true });
}
