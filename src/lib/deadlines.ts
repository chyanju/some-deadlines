import { DateTime } from "luxon";
import { conferences, typeBySub } from "../data/conferences";
import { site } from "../data/site";
import type { Conference, ConfType } from "../types";

const FMT = "yyyy-MM-dd HH:mm:ss";
const TZ_FMT = "ccc, dd LLL yyyy HH:mm:ss";

/** Parse a 'YYYY-MM-DD HH:MM:SS' wall-clock time in `zone`. Returns null for TBA/invalid. */
export function parseInZone(value: string | undefined, zone: string): DateTime | null {
  if (!value) return null;
  const v = value.trim();
  if (!v || v.toUpperCase() === "TBA") return null;
  const dt = DateTime.fromFormat(v, FMT, { zone });
  return dt.isValid ? dt : null;
}

function inConfTz(dt: DateTime | null, label: string): string | null {
  return dt ? `${dt.toFormat(TZ_FMT)} (${label})` : null;
}

/** A conference enriched with computed deadline instants and categories. */
export interface ProcessedConference extends Conference {
  subs: string[];
  categories: ConfType[];
  /** Paper deadline as epoch ms (absolute UTC instant); null when TBA. */
  deadlineMs: number | null;
  /** Abstract deadline as epoch ms; null when absent/TBA. */
  absDeadlineMs: number | null;
  isTba: boolean;
  /** Paper deadline rendered in the conference's own timezone. */
  deadlineInConfTz: string | null;
  /** Abstract deadline rendered in the conference's own timezone. */
  absInConfTz: string | null;
}

export function process(c: Conference): ProcessedConference {
  const zone = c.timezone || site.defaultTimezone;
  const dl = parseInZone(c.deadline, zone);
  const abs = parseInZone(c.abstract_deadline, zone);
  const subs = String(c.sub)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    ...c,
    subs,
    categories: subs
      .map((s) => typeBySub.get(s))
      .filter((t): t is ConfType => Boolean(t)),
    deadlineMs: dl?.toMillis() ?? null,
    absDeadlineMs: abs?.toMillis() ?? null,
    isTba: !dl,
    deadlineInConfTz: inConfTz(dl, c.timezone),
    absInConfTz: inConfTz(abs, c.timezone),
  };
}

export const allConferences: ProcessedConference[] = conferences.map(process);

/** Sorted by deadline ascending (TBA last). The client refines past vs. upcoming at view time. */
export const byDeadline: ProcessedConference[] = [...allConferences].sort((a, b) => {
  if (a.deadlineMs == null) return 1;
  if (b.deadlineMs == null) return -1;
  return a.deadlineMs - b.deadlineMs;
});

export function getById(id: string): ProcessedConference | undefined {
  return allConferences.find((c) => c.id === id);
}

/** A "Add to Google Calendar" event-template URL for a conference's paper deadline. */
export function gcalEventUrl(c: ProcessedConference): string | null {
  if (c.deadlineMs == null) return null;
  const t = DateTime.fromMillis(c.deadlineMs, { zone: "utc" }).toFormat(
    "yyyyMMdd'T'HHmmss'Z'",
  );
  const text = encodeURIComponent(`${c.title} ${c.year} deadline`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${t}/${t}`;
}
