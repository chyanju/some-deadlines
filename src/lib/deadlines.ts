import { DateTime } from "luxon";
import { conferences, typeBySub } from "../data/conferences";
import { site } from "../data/site";
import type { Conference, ConfType } from "../types";

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

/** A conference enriched with computed deadline instants and categories. */
export interface ProcessedConference extends Conference {
  subs: string[];
  categories: ConfType[];
  /** Paper deadline as epoch ms (absolute UTC instant); null when TBA. */
  deadlineMs: number | null;
  /** Abstract deadline as epoch ms; null when absent/TBA. */
  absDeadlineMs: number | null;
  isTba: boolean;
  /** Compact paper deadline for cards, e.g. "Thu 13 Nov 2025, 23:59 UTC-12". */
  deadlineShort: string | null;
  /** Compact abstract deadline for cards. */
  absShort: string | null;
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
    deadlineShort: shortInConfTz(dl, c.timezone),
    absShort: shortInConfTz(abs, c.timezone),
  };
}

export const allConferences: ProcessedConference[] = conferences.map(process);

/** Sorted by deadline ascending (TBA last). The client refines past vs. upcoming at view time. */
export const byDeadline: ProcessedConference[] = [...allConferences].sort((a, b) => {
  if (a.deadlineMs == null) return 1;
  if (b.deadlineMs == null) return -1;
  return a.deadlineMs - b.deadlineMs;
});

/** A single calendar-addable deadline (paper or abstract) of a conference, with
 *  everything the card and the .ics endpoints need to add just that one date. */
export interface DeadlineItem {
  kind: "paper" | "abstract";
  /** Epoch-ms instant of the deadline. */
  ms: number;
  /** Event title, e.g. "[ICSE 2027] Paper Deadline". */
  summary: string;
  /** Stable slug, e.g. "icse2027-paper" (the UID stem and .ics filename). */
  uid: string;
  /** Per-deadline .ics download path. */
  icsHref: string;
  /** "Add to Google Calendar" template URL for this one deadline. */
  gcalUrl: string;
}

/** Build a Google Calendar "create event" template URL for one instant. */
function gcalTemplateUrl(summary: string, ms: number): string {
  const t = DateTime.fromMillis(ms, { zone: "utc" }).toFormat("yyyyMMdd'T'HHmmss'Z'");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(summary)}&dates=${t}/${t}`;
}

/** The calendar-addable deadlines of a conference (paper first, then abstract, to
 *  match the card). TBA deadlines are omitted — there is nothing to add. */
export function deadlineItems(c: ProcessedConference): DeadlineItem[] {
  const out: DeadlineItem[] = [];
  const add = (kind: "paper" | "abstract", label: string, ms: number) => {
    const summary = `[${c.title} ${c.year}] ${label} Deadline`;
    const uid = `${c.id}-${kind}`;
    out.push({
      kind,
      ms,
      summary,
      uid,
      icsHref: `/conference/${uid}.ics`,
      gcalUrl: gcalTemplateUrl(summary, ms),
    });
  };
  if (c.deadlineMs != null) add("paper", "Paper", c.deadlineMs);
  if (c.absDeadlineMs != null) add("abstract", "Abstract", c.absDeadlineMs);
  return out;
}
