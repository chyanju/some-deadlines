import { DateTime } from "luxon";
import { site } from "../data/site";

/** One calendar event: an instant (zero-duration) or a [ms, endMs] window. */
export interface IcsEvent {
  /** Stable UID stem ("@some-deadlines" is appended). */
  uid: string;
  summary: string;
  ms: number;
  /** End instant; defaults to `ms` (zero-duration) when null/omitted. */
  endMs?: number | null;
}

/** Format an epoch-ms instant as an iCalendar UTC timestamp. */
function fmtUtc(ms: number): string {
  return DateTime.fromMillis(ms, { zone: "utc" }).toFormat("yyyyMMdd'T'HHmmss'Z'");
}

/** Escape text per RFC 5545. */
function esc(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

function vevent(e: IcsEvent, stamp: string): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:${e.uid}@some-deadlines`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${fmtUtc(e.ms)}`,
    `DTEND:${fmtUtc(e.endMs ?? e.ms)}`,
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
