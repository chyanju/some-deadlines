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
  /** Conference start as epoch ms (midnight UTC of `start`); null when absent. */
  startMs: number | null;
  /** Conference "ended" instant — midnight UTC *after* `end`; null when absent.
   *  The meeting is ongoing while now is in [startMs, endMs), ended at/after endMs. */
  endMs: number | null;
  isTba: boolean;
  /** Compact paper deadline for cards, e.g. "Thu 13 Nov 2025, 23:59 UTC-12". */
  deadlineShort: string | null;
  /** Compact abstract deadline for cards. */
  absShort: string | null;
  /** Early-rejection notification. */
  earlyRejectMs: number | null;
  earlyRejectShort: string | null;
  /** Author-response (rebuttal) window; ongoing while now is in [start, end). */
  rebuttalStartMs: number | null;
  rebuttalEndMs: number | null;
  rebuttalShort: string | null;
  /** Acceptance/decision notification. */
  notificationMs: number | null;
  notificationShort: string | null;
}

export function process(c: Conference): ProcessedConference {
  const zone = c.timezone || site.defaultTimezone;
  const dl = parseInZone(c.deadline, zone);
  const abs = parseInZone(c.abstract_deadline, zone);
  const er = parseInZone(c.early_rejection, zone);
  const rstart = parseInZone(c.rebuttal_start, zone);
  const rend = parseInZone(c.rebuttal_end, zone);
  const notif = parseInZone(c.notification, zone);
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
    deadlineMs: dl?.toMillis() ?? null,
    absDeadlineMs: abs?.toMillis() ?? null,
    startMs: start?.isValid ? start.toMillis() : null,
    endMs: end?.isValid ? end.toMillis() : null,
    isTba: !dl,
    deadlineShort: shortInConfTz(dl, c.timezone),
    absShort: shortInConfTz(abs, c.timezone),
    earlyRejectMs: er?.toMillis() ?? null,
    earlyRejectShort: shortInConfTz(er, c.timezone),
    rebuttalStartMs: rstart?.toMillis() ?? null,
    rebuttalEndMs: rend?.toMillis() ?? null,
    rebuttalShort: shortInConfTz(rstart, c.timezone),
    notificationMs: notif?.toMillis() ?? null,
    notificationShort: shortInConfTz(notif, c.timezone),
  };
}

export const allConferences: ProcessedConference[] = conferences.map(process);

/** Sorted by deadline ascending (TBA last). The client refines past vs. upcoming at view time. */
export const byDeadline: ProcessedConference[] = [...allConferences].sort((a, b) => {
  if (a.deadlineMs == null) return 1;
  if (b.deadlineMs == null) return -1;
  return a.deadlineMs - b.deadlineMs;
});

/** A single calendar-addable milestone of a conference, with everything the card
 *  and the .ics endpoints need to add just that one date (or window). */
export interface DeadlineItem {
  kind: "paper" | "abstract" | "early-reject" | "rebuttal" | "notification";
  /** Epoch-ms instant of the milestone (the start, for a window like rebuttal). */
  ms: number;
  /** End instant for a window (rebuttal); null/omitted for point milestones. */
  endMs?: number | null;
  /** Event title, e.g. "[ICSE 2027] Paper Deadline". */
  summary: string;
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

/** The calendar-addable milestones of a conference, in card order (paper,
 *  abstract, early-reject, rebuttal, notification). Rebuttal carries an end
 *  (it is a window); the rest are instants. Absent milestones are omitted. */
export function deadlineItems(c: ProcessedConference): DeadlineItem[] {
  const out: DeadlineItem[] = [];
  const add = (kind: DeadlineItem["kind"], label: string, ms: number, endMs?: number | null) => {
    const summary = `[${c.title} ${c.year}] ${label}`;
    const uid = `${c.id}-${kind}`;
    out.push({
      kind,
      ms,
      endMs: endMs ?? null,
      summary,
      uid,
      icsHref: `/conference/${uid}.ics`,
      gcalUrl: gcalTemplateUrl(summary, ms, endMs),
    });
  };
  if (c.deadlineMs != null) add("paper", "Paper Deadline", c.deadlineMs);
  if (c.absDeadlineMs != null) add("abstract", "Abstract Deadline", c.absDeadlineMs);
  if (c.earlyRejectMs != null) add("early-reject", "Early Reject", c.earlyRejectMs);
  if (c.rebuttalStartMs != null) add("rebuttal", "Rebuttal", c.rebuttalStartMs, c.rebuttalEndMs);
  if (c.notificationMs != null) add("notification", "Notification", c.notificationMs);
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
