import { NextResponse } from "next/server";
import { appendChange, getBoard, saveBoard } from "@/app/lib/store";
import type { Board } from "@/app/lib/roadmap";

// Always hit storage fresh; never cache the board.
export const dynamic = "force-dynamic";

export async function GET() {
  const board = await getBoard();
  return NextResponse.json(board, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(request: Request) {
  let board: Board;
  try {
    board = (await request.json()) as Board;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!board || typeof board !== "object") {
    return NextResponse.json({ error: "invalid board" }, { status: 400 });
  }
  try {
    await saveBoard(board);
    await appendChange({
      at: new Date().toISOString(),
      kind: "board",
      summary: "Board rearranged / cards edited",
    });
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
