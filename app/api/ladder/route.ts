import { NextResponse } from "next/server";
import { getLadder, saveLadder } from "@/app/lib/store";
import type { LadderPayload } from "@/app/lib/ladder";

// Always hit storage fresh; never cache the ladder.
export const dynamic = "force-dynamic";

export async function GET() {
  const ladder = await getLadder();
  return NextResponse.json(ladder, {
    headers: { "Cache-Control": "no-store" },
  });
}

// Authenticated (via the password middleware) write of the whole ladder
// payload. Mirrors /api/board so the ladder is updatable from the canonical
// source (sessio-docs ladder.json) without needing the KV creds directly.
export async function PUT(request: Request) {
  let payload: LadderPayload;
  try {
    payload = (await request.json()) as LadderPayload;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!payload || !Array.isArray(payload.rungs)) {
    return NextResponse.json({ error: "invalid ladder" }, { status: 400 });
  }
  try {
    await saveLadder(payload);
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
