// Shared-password auth. One team password (ROADMAP_PASSWORD). On login we set
// an HttpOnly cookie holding a hash of the password; middleware checks it.
// Uses Web Crypto so it runs in both the Edge middleware and Node route.

export const AUTH_COOKIE = "roadmap_auth";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function tokenForPassword(password: string): Promise<string> {
  return sha256Hex(`sessio-roadmap::${password}`);
}

// Roles. The team password unlocks everything; the investor password unlocks
// ONLY the investor board (/investor). Tokens differ because the passwords do.
export type Role = "team" | "investor" | null;

export async function roleForCookie(
  cookieValue: string | undefined,
  teamPassword: string | undefined,
  investorPassword: string | undefined,
): Promise<Role> {
  if (!cookieValue) return null;
  if (teamPassword && cookieValue === (await tokenForPassword(teamPassword)))
    return "team";
  if (
    investorPassword &&
    cookieValue === (await tokenForPassword(investorPassword))
  )
    return "investor";
  return null;
}
