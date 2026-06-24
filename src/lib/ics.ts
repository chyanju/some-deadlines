import { DateTime } from "luxon";
import { site } from "../data/site";

/** One calendar event: a day (point milestone) or a [ms, endMs] span of days. */
export interface IcsEvent {
  /** Stable UID stem ("@some-deadlines" is appended). */
  uid: string;
  summary: string;
  ms: number;
  /** End instant; defaults to `ms` (a single day) when null/omitted. */
  endMs?: number | null;
  /** Timezone whose calendar date the all-day event lands on — the deadline's
   *  own zone, so a 'Nov 13 23:59 AoE' deadline becomes an all-day event on
   *  Nov 13 (not an hour-level block, and not shifted by the viewer's zone). */
  tz: string;
}

/** The calendar date (yyyyMMdd) an instant falls on in `tz`. */
function fmtDate(ms: number, tz: string): string {
  return DateTime.fromMillis(ms, { zone: tz }).toFormat("yyyyMMdd");
}

/** Escape text per RFC 5545. */
function esc(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

/**
 * One all-day VEVENT. Deadlines (and the rebuttal window) are recorded as
 * DATE-valued events so a calendar marks the day(s) rather than an hour-level
 * time block. DTEND is exclusive per RFC 5545, so it's the instant's date + 1:
 * a point milestone spans its single day; a window spans start..end inclusive.
 */
function vevent(e: IcsEvent, stamp: string): string[] {
  const start = fmtDate(e.ms, e.tz);
  const endExclusive = DateTime.fromMillis(e.endMs ?? e.ms, { zone: e.tz })
    .plus({ days: 1 })
    .toFormat("yyyyMMdd");
  return [
    "BEGIN:VEVENT",
    `UID:${e.uid}@some-deadlines`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${endExclusive}`,
    `SUMMARY:${esc(e.summary)}`,
    "END:VEVENT",
  ];
}

/**
 * Build a VCALENDAR feed from explicit events. Each is emitted as a UTC instant
 * (no TZID / VTIMEZONE needed) since deadlines are already resolved to absolute
 * instants.
 */
export function buildIcs(events: IcsEvent[]): string {
  const stamp = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//some-deadlines//EN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(site.title)}`,
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of events) lines.push(...vevent(e, stamp));
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
