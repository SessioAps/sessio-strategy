// ---------------------------------------------------------------------------
// Roadmap TAXONOMY + types. Structural only (division names, colors, time
// buckets, statuses). NO real roadmap content lives in this PUBLIC repo —
// SEED and MILESTONES are EMPTY here; the real data loads from the private
// store (see store.ts).
// ---------------------------------------------------------------------------

export type Area =
  | "milestones"
  | "strategy"
  | "development"
  | "people"
  | "financials"
  | "pr"
  | "events";

export type Time = "now" | "next" | "later";

export type Status = "done" | "active" | "planned" | "blocked";

export type Card = {
  id: string;
  title: string;
  note?: string;
  detail?: string;
  status?: Status;
  owner?: string;
  date?: string;
};

export type CellId = `${Area}::${Time}`;
export type Board = Record<CellId, Card[]>;

export const TIMES: Time[] = ["now", "next", "later"];

export const TIME_META: Record<Time, { label: string; sub: string }> = {
  now: { label: "Now", sub: "In flight" },
  next: { label: "Next", sub: "Up next" },
  later: { label: "Later", sub: "On the horizon" },
};

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  done: { label: "Done", color: "#3ed4b1" },
  active: { label: "Active", color: "#2563eb" },
  planned: { label: "Planned", color: "#8f9098" },
  blocked: { label: "Blocked", color: "#f4438d" },
};

export const AREA_ORDER: Area[] = [
  "milestones",
  "strategy",
  "development",
  "people",
  "financials",
  "pr",
  "events",
];

export const AREAS: Record<
  Area,
  { label: string; short: string; color: string; objective: string; owner?: string }
> = {
  milestones: {
    label: "Key milestones",
    short: "Milestones",
    color: "#c5c6cc",
    objective: "The dates that matter — launches, showcases, and deadlines.",
  },
  strategy: {
    label: "Strategy",
    short: "Strategy",
    color: "#aa6dfc",
    objective: "Where we’re headed and the bets that get us there.",
  },
  development: {
    label: "Development",
    short: "Development",
    color: "#2563eb",
    objective: "Ship the product and the surfaces around it.",
  },
  people: {
    label: "People",
    short: "People",
    color: "#3ed4b1",
    objective: "Build the team and the community behind Sessio.",
  },
  financials: {
    label: "Financials",
    short: "Financials",
    color: "#ffdd33",
    objective: "Fund the journey and keep the runway healthy.",
  },
  pr: {
    label: "PR",
    short: "PR",
    color: "#f4438d",
    objective: "Tell the story and bring the right people in.",
  },
  events: {
    label: "Events",
    short: "Events",
    color: "#e36f46",
    objective: "Show up where the music industry gathers.",
  },
};

export function cellId(area: Area, time: Time): CellId {
  return `${area}::${time}`;
}

export function parseCell(id: CellId): { area: Area; time: Time } {
  const [area, time] = id.split("::") as [Area, Time];
  return { area, time };
}

export function emptyBoard(): Board {
  const b = {} as Board;
  for (const area of AREA_ORDER) {
    for (const time of TIMES) {
      b[cellId(area, time)] = [];
    }
  }
  return b;
}

export type Milestone = {
  id: string;
  title: string;
  date: string;
  iso: string;
  isoEnd?: string;
  area: Area;
  location?: string;
  status?: Status;
};

// EMPTY in the public repo — real milestones load from the private store.
export const MILESTONES: Milestone[] = [];

// EMPTY in the public repo — real board content loads from the private store.
export const SEED: Board = emptyBoard();
