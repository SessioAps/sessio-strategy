import { NextResponse } from "next/server";
import { AUTH_COOKIE, tokenForPassword } from "@/app/lib/auth";

export async function POST(request: Request) {
  const password = process.env.ROADMAP_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (body.password !== password) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await tokenForPassword(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
