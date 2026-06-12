// ---------------------------------------------------------------------------
// M-ladder TYPES + display meta only. NO rung content lives here — the public
// repo carries no roadmap data. The real ladder is loaded from the private
// store (getLadder).
// ---------------------------------------------------------------------------

export type RungStatus = "shipped" | "building" | "planned" | "horizon";

export type Rung = {
  id: string; // M1 ... M30
  name: string;
  scope: string;
  runsOn: string[]; // "Web" | "App" | "Portal"
  status: RungStatus;
  app?: string; // app surface at this rung (parity crosswalk)
  portal?: string; // portal surface at this rung
  // Granular steps, paired where app + portal must land together (one row =
  // one step; both sides set = ships simultaneously). From app-portal-parity.md.
  steps?: { app?: string; portal?: string }[];
};

export type CoreRelease = { from: string; to: string; label: string };
export type OneOhMoment = { after: string; label: string; date: string };

export type LadderPayload = {
  rungs: Rung[];
  coreRelease: CoreRelease | null;
  oneOhMoment: OneOhMoment | null;
};

export const LADDER_SOURCE = "the canonical product roadmap";

export const RUNG_STATUS: Record<RungStatus, { label: string; color: string }> = {
  shipped: { label: "Shipped", color: "#3ed4b1" },
  building: { label: "In build", color: "#2563eb" },
  planned: { label: "Planned", color: "#8f9098" },
  horizon: { label: "Horizon", color: "#aa6dfc" },
};
