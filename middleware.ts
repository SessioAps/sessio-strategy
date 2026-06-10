import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, tokenForPassword } from "@/app/lib/auth";

// Guard everything except the login page, the login API, and Next internals.
export const config = {
  matcher: ["/((?!_next|favicon.ico|login|api/login).*)"],
};

export async function middleware(req: NextRequest) {
  const password = process.env.ROADMAP_PASSWORD;

  // No password configured: open in local dev, but fail closed in production
  // so an unconfigured deploy is never silently public.
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        "Roadmap not configured: set ROADMAP_PASSWORD in the environment.",
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  const expected = await tokenForPassword(password);
  if (req.cookies.get(AUTH_COOKIE)?.value === expected) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}
