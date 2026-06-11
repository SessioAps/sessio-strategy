import { NextResponse } from "next/server";
import { addContact, appendChange } from "@/app/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { name?: string; org?: string; role?: string; note?: string; email?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  await addContact({
    id: `n-${Date.now().toString(36)}`,
    name,
    org: body.org?.trim() || undefined,
    role: body.role?.trim() || undefined,
    note: body.note?.trim() || undefined,
    email: body.email?.trim() || undefined,
    phone: body.phone?.trim() || undefined,
  });
  await appendChange({ at: new Date().toISOString(), kind: "event", summary: `Contact added: ${name}` });
  return NextResponse.json({ ok: true });
}
