// ---------------------------------------------------------------------------
// M-ladder TYPES + display meta only. NO rung content lives here — the public
// repo carries no roadmap data. The real ladder is loaded from the private
// store (getLadder).
// ---------------------------------------------------------------------------

export type RungStatus = "shipped" | "building" | "planned" | "horizon";

// Need-to-have vs nice-to-have banding (Mattis, 2026-06-14). Cut at M10|M11:
// M1-M10 = core (build now), M11+ = nice-to-have (later).
export type Band = "need" | "nice" | "horizon";

export type Rung = {
  id: string; // M1 ... M30
  name: string;
  scope: string;
  runsOn: string[]; // "Web" | "App" | "Portal"
  status: RungStatus;
  band?: Band; // optional so legacy payloads still render (default "need")
  app?: string; // app surface at this rung (parity crosswalk)
  portal?: string; // portal surface at this rung
  // Granular steps, paired where app + portal must land together (one row =
  // one step; both sides set = ships simultaneously). From app-portal-parity.md.
  steps?: { app?: string; portal?: string; appDone?: boolean; portalDone?: boolean }[];
};

export const BAND_ORDER: Band[] = ["need", "nice", "horizon"];

export const BAND_META: Record<Band, { label: string; sub: string; color: string }> = {
  need: { label: "Need to have", sub: "Build now", color: "#3ed4b1" },
  nice: { label: "Nice to have", sub: "Later", color: "#e0a82e" },
  horizon: { label: "Far horizon", sub: "", color: "#8f9098" },
};

export type CoreRelease = { from: string; to: string; label: string };
export type OneOhMoment = { after: string; label: string; date: string };

export type LadderPayload = {
  rungs: Rung[];
  coreRelease: CoreRelease | null;
  oneOhMoment: OneOhMoment | null;
  // A second, distinct moment marker for the big public launch (28 Aug),
  // rendered on the ladder after `after`. Same shape as the 1.0 moment.
  launchMoment?: OneOhMoment | null;
};

export const LADDER_SOURCE = "the canonical product roadmap";

export const RUNG_STATUS: Record<RungStatus, { label: string; color: string }> = {
  shipped: { label: "Shipped", color: "#3ed4b1" },
  building: { label: "In build", color: "#2563eb" },
  planned: { label: "Planned", color: "#8f9098" },
  horizon: { label: "Horizon", color: "#aa6dfc" },
};
