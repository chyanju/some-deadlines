import { DateTime } from "luxon";
import { conferences, typeBySub } from "../data/conferences";
import { site } from "../data/site";
import type { Conference, ConfType } from "../types";
import { MILESTONES, type ProcessedMilestone } from "./milestones";

const FMT = "yyyy-MM-dd HH:mm:ss";
const SHORT_FMT = "ccc dd LLL yyyy, HH:mm";

/** Parse a 'YYYY-MM-DD HH:MM:SS' wall-clock time in `zone`. Returns null for TBA/invalid. */
export function parseInZone(value: string | undefined, zone: string): DateTime | null {
  if (!value) return null;
  const v = value.trim();
  if (!v || v.toUpperCase() === "TBA") return null;
  const dt = DateTime.fromFormat(v, FMT, { zone });
  return dt.isValid ? dt : null;
}

function shortInConfTz(dt: DateTime | null, label: string): string | null {
  return dt ? `${dt.toFormat(SHORT_FMT)} ${label}` : null;
}

/** A conference enriched with computed milestone instants and categories. */
export interface ProcessedConference extends Conference {
  subs: string[];
  categories: ConfType[];
  /** Every dated milestone in registry order (see lib/milestones). */
  milestones: ProcessedMilestone[];
  /** Paper deadline as epoch ms — the submission deadline; drives "closed" + the
   *  default sort. Convenience mirror of the "paper" milestone. */
  deadlineMs: number | null;
  /** Compact paper deadline for cards, e.g. "Thu 13 Nov 2025, 23:59 UTC-12". */
  deadlineShort: string | null;
  /** Conference start as epoch ms (midnight UTC of `start`); null when absent. */
  startMs: number | null;
  /** Conference "ended" instant — midnight UTC *after* `end`; null when absent.
   *  The meeting is ongoing while now is in [startMs, endMs), ended at/after endMs. */
  endMs: number | null;
  /** Paper deadline is TBA/absent. */
  isTba: boolean;
}

export function process(c: Conference): ProcessedConference {
  const zone = c.timezone || site.defaultTimezone;
  const milestones: ProcessedMilestone[] = MILESTONES.map((d) => {
    const start = parseInZone(c[d.field] as string | undefined, zone);
    const end = d.endField ? parseInZone(c[d.endField] as string | undefined, zone) : null;
    return {
      key: d.key,
      label: d.label,
      ms: start?.toMillis() ?? null,
      endMs: end?.toMillis() ?? null,
      short: shortInConfTz(start, c.timezone),
      calendar: d.calendar,
      phase: d.phase,
      always: d.always ?? false,
      strong: d.strong ?? false,
    };
  });
  const paper = milestones.find((m) => m.key === "paper");
  const start = c.start ? DateTime.fromISO(c.start, { zone: "utc" }) : null;
  // Ongoing through the whole end day, so the "ended" instant is the next midnight.
  const end = c.end ? DateTime.fromISO(c.end, { zone: "utc" }).plus({ days: 1 }) : null;
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
    milestones,
    deadlineMs: paper?.ms ?? null,
    deadlineShort: paper?.short ?? null,
    startMs: start?.isValid ? start.toMillis() : null,
    endMs: end?.isValid ? end.toMillis() : null,
    isTba: paper?.ms == null,
  };
}

export const allConferences: ProcessedConference[] = conferences.map(process);

/** Sorted by deadline ascending (TBA last). The client refines past vs. upcoming at view time. */
export const byDeadline: ProcessedConference[] = [...allConferences].sort((a, b) => {
  if (a.deadlineMs == null) return 1;
  if (b.deadlineMs == null) return -1;
  return a.deadlineMs - b.deadlineMs;
});

/** A single calendar-addable milestone, with everything the card and the .ics
 *  endpoints need to add just that one date (or window, for rebuttal). */
export interface DeadlineItem {
  /** Milestone key (also the .ics uid stem suffix). */
  kind: string;
  /** The instant (the start, for a window). */
  ms: number;
  /** End instant for a window (rebuttal); null for point milestones. */
  endMs: number | null;
  /** Event title, e.g. "[ICSE 2027] Paper Deadline". */
  summary: string;
  /** Tooltip noun for the icons, e.g. "paper deadline" / "rebuttal period". */
  noun: string;
  /** Stable slug, e.g. "icse2027-paper" (the UID stem and .ics filename). */
  uid: string;
  /** Per-milestone .ics download path. */
  icsHref: string;
  /** "Add to Google Calendar" template URL for this one milestone. */
  gcalUrl: string;
}

/** Build a Google Calendar "create event" template URL for an instant or a
 *  [start, end] window (end defaults to start -> a zero-duration event). */
function gcalTemplateUrl(summary: string, ms: number, endMs?: number | null): string {
  const fmt = (m: number) =>
    DateTime.fromMillis(m, { zone: "utc" }).toFormat("yyyyMMdd'T'HHmmss'Z'");
  const start = fmt(ms);
  const end = endMs != null ? fmt(endMs) : start;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(summary)}&dates=${start}/${end}`;
}

const DEF_BY_KEY = new Map(MILESTONES.map((d) => [d.key, d]));

/** The calendar-addable milestones of a conference, in card order. Milestones with
 *  no date (or not calendar-addable) are omitted — there is nothing to add. */
export function deadlineItems(c: ProcessedConference): DeadlineItem[] {
  const out: DeadlineItem[] = [];
  for (const m of c.milestones) {
    if (!m.calendar || m.ms == null) continue;
    const def = DEF_BY_KEY.get(m.key)!;
    const summary = `[${c.title} ${c.year}] ${def.summary}`;
    const uid = `${c.id}-${m.key}`;
    out.push({
      kind: m.key,
      ms: m.ms,
      endMs: m.endMs,
      summary,
      noun: def.noun,
      uid,
      icsHref: `${import.meta.env.BASE_URL}/conference/${uid}.ics`,
      gcalUrl: gcalTemplateUrl(summary, m.ms, m.endMs),
    });
  }
  return out;
}

const MONTHS_ABBR: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr",
  May: "May", June: "Jun", July: "Jul", August: "Aug",
  September: "Sep", October: "Oct", November: "Nov", December: "Dec",
};

/** Abbreviate full English month names in a free-text date, e.g.
 *  "September 29 - October 2, 2026" -> "Sep 29 - Oct 2, 2026", so the conference
 *  date stays compact next to the (often long) place. */
export function abbrevMonths(s: string): string {
  return s.replace(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g,
    (m) => MONTHS_ABBR[m],
  );
}
