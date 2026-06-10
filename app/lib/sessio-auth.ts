// ---------------------------------------------------------------------------
// Sessio SSO via the existing Better Auth server (api.sessio.io/api/auth).
// Edge-compatible: only uses fetch + process.env. Validates a session and
// restricts access to the company email domain.
//
// Activated by AUTH_MODE=sessio. Requires (on the auth server, Arne):
//   - roadmap.sessio.io in trustedOrigins
//   - cross-subdomain session cookie on .sessio.io
// ---------------------------------------------------------------------------

function authApiBase(): string {
  return process.env.SESSIO_AUTH_URL || "https://api.sessio.io/api/auth";
}

export function allowedDomain(): string {
  return (process.env.ALLOWED_EMAIL_DOMAIN || "sessio.io").toLowerCase();
}

export function authMode(): "sessio" | "password" {
  return process.env.AUTH_MODE === "sessio" ? "sessio" : "password";
}

export type SessioUser = { email: string; name?: string };

/** Validate the Better Auth session by forwarding the request cookies. */
export async function getSessioUser(
  cookieHeader: string | null,
): Promise<SessioUser | null> {
  if (!cookieHeader) return null;
  try {
    const res = await fetch(`${authApiBase()}/get-session`, {
      headers: { cookie: cookieHeader, accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { email?: string; name?: string };
    } | null;
    const email = data?.user?.email;
    if (!email || typeof email !== "string") return null;
    return { email, name: data?.user?.name };
  } catch {
    return null;
  }
}

export function isAllowedEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@" + allowedDomain());
}
