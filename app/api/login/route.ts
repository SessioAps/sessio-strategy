import { NextResponse } from "next/server";
import { AUTH_COOKIE, tokenForPassword } from "@/app/lib/auth";

export async function POST(request: Request) {
  const teamPassword = process.env.ROADMAP_PASSWORD;
  const investorPassword = process.env.ROADMAP_INVESTOR_PASSWORD;
  if (!teamPassword) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  let matched: string | null = null;
  let redirect = "/";
  if (body.password === teamPassword) {
    matched = teamPassword;
  } else if (investorPassword && body.password === investorPassword) {
    matched = investorPassword;
    redirect = "/investor";
  }
  if (!matched) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, redirect });
  res.cookies.set(AUTH_COOKIE, await tokenForPassword(matched), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
