import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, roleForCookie, tokenForPassword } from "@/app/lib/auth";
import { authMode, getSessioUser, isAllowedEmail } from "@/app/lib/sessio-auth";

// Guard everything except the login page, the auth endpoints, and Next internals.
export const config = {
  matcher: ["/((?!_next|favicon.ico|login|api/login|api/auth).*)"],
};

function toLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  // --- Sessio SSO mode: validate a Better Auth session, restrict to the domain.
  if (authMode() === "sessio") {
    const user = await getSessioUser(req.headers.get("cookie"));
    if (user && isAllowedEmail(user.email)) return NextResponse.next();
    return toLogin(req);
  }

  // --- Shared-password mode (default), now role-aware.
  const password = process.env.ROADMAP_PASSWORD;
  const investorPassword = process.env.ROADMAP_INVESTOR_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        "Roadmap not configured: set ROADMAP_PASSWORD (or AUTH_MODE=sessio).",
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  const role = await roleForCookie(
    req.cookies.get(AUTH_COOKIE)?.value,
    password,
    investorPassword,
  );

  // Team: full access.
  if (role === "team") return NextResponse.next();

  // Investor: ONLY the investor board, nothing else. Everything internal
  // (roadmap, pipeline, financials, network…) is invisible and unreachable.
  if (role === "investor") {
    if (req.nextUrl.pathname.startsWith("/investor")) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/investor";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return toLogin(req);
}
