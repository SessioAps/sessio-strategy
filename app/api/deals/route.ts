import { NextResponse } from "next/server";
import { appendChange, getPipeline } from "@/app/lib/store";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Move a deal to another stage (in-board editing). Journaled so it sweeps
// back into the docs.
export async function PUT(request: Request) {
  let body: { id?: string; stage?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const pipeline = await getPipeline();
  const deal = pipeline.deals.find((d) => d.id === body.id);
  if (!deal) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!body.stage || !pipeline.stages.includes(body.stage)) {
    return NextResponse.json({ error: "bad stage" }, { status: 400 });
  }
  const from = deal.stage;
  deal.stage = body.stage;
  deal.history = [
    ...(deal.history ?? []),
    {
      at: new Date().toISOString().slice(0, 10),
      note: body.note?.trim() || `Stage: ${from} → ${body.stage}`,
    },
  ];
  await fs.writeFile(
    path.join(process.cwd(), ".data", "pipeline.json"),
    JSON.stringify(pipeline, null, 1),
    "utf8",
  );
  await appendChange({
    at: new Date().toISOString(),
    kind: "event",
    summary: `B2B: ${deal.org} moved ${from} → ${body.stage}`,
  });
  return NextResponse.json({ ok: true });
}
