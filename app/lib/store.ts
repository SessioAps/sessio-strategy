// ---------------------------------------------------------------------------
// Content store. The PUBLIC repo ships with NO real content — every getter
// here falls back to EMPTY. The actual roadmap content lives only in the
// private store:
//   • Production: Upstash / Vercel KV (private).
//   • Local dev: gitignored JSON files under .data/ (never committed).
// So the public code is just the renderer; the data is private.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import {
  emptyBoard,
  type Board,
  type Milestone,
  type Sectors,
} from "@/app/lib/roadmap";
import type { LadderPayload } from "@/app/lib/ladder";

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const usingKv = Boolean(KV_URL && KV_TOKEN);
const DATA_DIR = path.join(process.cwd(), ".data");

async function kvCommand(command: unknown[]): Promise<unknown> {
  const res = await fetch(KV_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${String(command[0])} failed: ${res.status}`);
  const json = (await res.json()) as { result: unknown };
  return json.result;
}

async function readKey<T>(name: string): Promise<T | null> {
  try {
    if (usingKv) {
      const result = (await kvCommand(["GET", `sessio:roadmap:${name}`])) as
        | string
        | null;
      return result ? (JSON.parse(result) as T) : null;
    }
    const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeKey(name: string, value: unknown): Promise<void> {
  if (usingKv) {
    await kvCommand(["SET", `sessio:roadmap:${name}`, JSON.stringify(value)]);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `${name}.json`),
    JSON.stringify(value, null, 2),
    "utf8",
  );
}

// Board — merged over an empty board so every cell exists. Empty if unset.
export async function getBoard(): Promise<Board> {
  try {
    const saved = await readKey<Board>("board");
    return saved ? { ...emptyBoard(), ...saved } : emptyBoard();
  } catch {
    return emptyBoard();
  }
}

export async function saveBoard(board: Board): Promise<void> {
  await writeKey("board", board);
}

// Ladder — empty payload if unset.
export async function getLadder(): Promise<LadderPayload> {
  const saved = await readKey<LadderPayload>("ladder");
  return saved ?? { rungs: [], coreRelease: null, oneOhMoment: null };
}

export async function saveLadder(payload: LadderPayload): Promise<void> {
  await writeKey("ladder", payload);
}

// Milestones — empty list if unset.
export async function getMilestones(): Promise<Milestone[]> {
  return (await readKey<Milestone[]>("milestones")) ?? [];
}

// Per-sector vision + focus — empty if unset.
export async function getSectors(): Promise<Sectors> {
  return (await readKey<Sectors>("sectors")) ?? {};
}

export async function saveMilestones(milestones: Milestone[]): Promise<void> {
  await writeKey("milestones", milestones);
}

// Change journal — every edit made through the site is recorded here so the
// changes can be swept back into sessio-docs as real commits (the docs stay
// the source of truth; the journal is the bridge). Capped at the last 500.
export type ChangeEntry = {
  at: string; // ISO timestamp
  kind: "board" | "event";
  summary: string;
};

export async function appendChange(entry: ChangeEntry): Promise<void> {
  const log = (await readKey<ChangeEntry[]>("changes")) ?? [];
  log.push(entry);
  await writeKey("changes", log.slice(-500));
}

// Events synced from the hello@sessio.io calendar — empty if unset.
export async function getCalendarEvents(): Promise<Milestone[]> {
  return (await readKey<Milestone[]>("calendar")) ?? [];
}

// Everything dated, one stream: strategic milestones + the shared calendar.
// Vision items are excluded — they're direction, not dated commitments, so they
// never appear on the timeline / home / sector journeys as promises.
export async function getEvents(): Promise<Milestone[]> {
  const [milestones, calendar] = await Promise.all([
    getMilestones(),
    getCalendarEvents(),
  ]);
  return [...milestones, ...calendar]
    .filter((m) => !m.vision)
    .sort((a, b) => a.iso.localeCompare(b.iso));
}

// Direction markers — the "where this ends up" outcomes we can't put a promised
// date on. Shown under the vision, never on the timeline.
export async function getVisionItems(): Promise<Milestone[]> {
  return (await getMilestones()).filter((m) => m.vision);
}

export const storageBackend = usingKv ? "kv" : "file";

// Publisher / partner pipeline — dialogues and their stages.
export type Deal = {
  id: string;
  org: string;
  kind: string;
  stage: string;
  contacts?: string;
  owner?: string;
  last?: string;
  next?: string;
  history?: { at: string; note: string }[];
  nextMeeting?: { at: string; label: string };
};
export type Pipeline = { stages: string[]; deals: Deal[] };

export async function getPipeline(): Promise<Pipeline> {
  return (await readKey<Pipeline>("pipeline")) ?? { stages: [], deals: [] };
}

// Network — people we meet and mention; maintained by Claude from meetings
// and conversations, plus manual adds on /network.
export type Contact = {
  id: string;
  name: string;
  org?: string;
  role?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  note?: string;
};
export async function getNetwork(): Promise<Contact[]> {
  return (await readKey<Contact[]>("network")) ?? [];
}
export async function addContact(c: Contact): Promise<void> {
  const all = await getNetwork();
  all.push(c);
  await writeKey("network", all);
}

// AI hub — short headlines on where it's all going (Moonshots pod + industry),
// refreshed by the morning sync.
export type AiItem = { id: string; headline: string; take: string; source?: string; date?: string };
export async function getAiItems(): Promise<AiItem[]> {
  return (await readKey<AiItem[]>("ai")) ?? [];
}

// Team — the people building Sessio. Shown on /team and on the investor board.
export type TeamMember = {
  id: string;
  name: string;
  role?: string;
  email?: string;
  linkedin?: string;
};
export async function getTeam(): Promise<TeamMember[]> {
  return (await readKey<TeamMember[]>("team")) ?? [];
}
export async function addTeamMember(m: TeamMember): Promise<void> {
  const all = await getTeam();
  all.push(m);
  await writeKey("team", all);
}

// Investor board — a separate, walled-off surface. Holds curated updates and
// links to the access-controlled data room (cap table & SHA live in SharePoint,
// never here). Maintained by the team; investors only read.
export type InvestorUpdate = {
  id: string;
  date: string; // YYYY-MM
  title: string;
  body: string;
  tag?: string; // "Team" | "Product" | "Fundraise" | "Traction" | …
};
export type DataRoomLink = {
  label: string;
  url: string;
  note?: string;
};
export type InvestorBoard = {
  intro?: string;
  updates: InvestorUpdate[];
  dataRoom: DataRoomLink[];
  links?: DataRoomLink[];
};

export async function getInvestorBoard(): Promise<InvestorBoard> {
  return (
    (await readKey<InvestorBoard>("investor")) ?? {
      updates: [],
      dataRoom: [],
    }
  );
}

export async function addInvestorUpdate(update: InvestorUpdate): Promise<void> {
  const board = await getInvestorBoard();
  board.updates.unshift(update);
  await writeKey("investor", board);
}
