import { NextResponse } from "next/server";
import { addTeamMember, appendChange } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { name?: string; role?: string; email?: string; linkedin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  await addTeamMember({
    id: `t-${Date.now().toString(36)}`,
    name,
    role: body.role?.trim() || undefined,
    email: body.email?.trim() || undefined,
    linkedin: body.linkedin?.trim() || undefined,
  });
  await appendChange({ at: new Date().toISOString(), kind: "event", summary: `Team member added: ${name}` });
  return NextResponse.json({ ok: true });
}
