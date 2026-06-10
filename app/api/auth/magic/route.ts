import { NextResponse } from "next/server";
import { allowedDomain } from "@/app/lib/sessio-auth";

// Kicks off a magic-link sign-in against the Sessio Better Auth server.
// Only sends a link to company-domain emails.
export async function POST(request: Request) {
  const base = process.env.SESSIO_AUTH_URL || "https://api.sessio.io/api/auth";
  const domain = allowedDomain();

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !email.endsWith("@" + domain)) {
    return NextResponse.json(
      { error: `Only @${domain} email addresses can sign in.` },
      { status: 403 },
    );
  }

  const callbackURL = (process.env.SITE_URL || new URL(request.url).origin) + "/";

  try {
    const res = await fetch(`${base}/sign-in/magic-link`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, callbackURL }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Could not send the sign-in link.", detail: detail.slice(0, 200) },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Auth server unreachable." }, { status: 502 });
  }
}
