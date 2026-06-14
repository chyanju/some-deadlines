import type { Conference } from "../types";

/**
 * The milestone registry — the single source of truth for every dated milestone a
 * conference can have (besides the meeting itself). It drives the parser
 * (lib/deadlines), the card rows + add-to-calendar buttons (ConferenceCard /
 * DeadlineActions), the per-milestone .ics endpoints, and the "Nearest Milestone"
 * sort.
 *
 * To add a milestone: declare its field(s) on Conference (src/types.ts), add one
 * entry here, then fill the dates in conferences.yml. Nothing else needs editing.
 */
export interface MilestoneDef {
  /** Stable key — the .ics uid suffix and the card↔calendar join key. */
  key: string;
  /** Row label (the <dt>). */
  label: string;
  /** Calendar-event title suffix, e.g. "Paper Deadline". */
  summary: string;
  /** Tooltip noun for the add-to-calendar icons, e.g. "rebuttal period". */
  noun: string;
  /** Conference field holding the date (the start, for an interval). */
  field: keyof Conference;
  /** Conference field holding the interval end; set ⇒ this milestone is a window. */
  endField?: keyof Conference;
  /** Offer the add-to-calendar icons for this milestone. */
  calendar: boolean;
  /** Chronological tie-break for same-day milestones (abstract < paper < …). */
  phase: number;
  /** Always render the row, even when the date is TBA/absent (paper). */
  always?: boolean;
  /** Emphasise the date (paper). */
  strong?: boolean;
}

export const MILESTONES: MilestoneDef[] = [
  { key: "abstract", label: "Abstract", summary: "Abstract Deadline", noun: "abstract deadline", field: "abstract_deadline", calendar: true, phase: 0 },
  { key: "paper", label: "Paper", summary: "Paper Deadline", noun: "paper deadline", field: "deadline", calendar: true, phase: 1, always: true, strong: true },
  { key: "early-reject", label: "Early Reject", summary: "Early Reject", noun: "early-reject date", field: "early_rejection", calendar: true, phase: 2 },
  { key: "rebuttal", label: "Rebuttal", summary: "Rebuttal", noun: "rebuttal period", field: "rebuttal_start", endField: "rebuttal_end", calendar: true, phase: 3 },
  { key: "notification", label: "Notification", summary: "Notification", noun: "notification date", field: "notification", calendar: true, phase: 4 },
];

/** A milestone resolved for one conference (instants + display strings). */
export interface ProcessedMilestone {
  key: string;
  label: string;
  /** The instant (the start, for a window); null when absent/TBA. */
  ms: number | null;
  /** End instant for a window (rebuttal); null otherwise. */
  endMs: number | null;
  /** Compact date for the card; null when absent. */
  short: string | null;
  calendar: boolean;
  phase: number;
  always: boolean;
  strong: boolean;
}
