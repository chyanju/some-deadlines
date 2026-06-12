import { DateTime } from "luxon";
import { site } from "../data/site";
import type { ProcessedConference } from "./deadlines";

/** Format an epoch-ms instant as an iCalendar UTC timestamp. */
function fmtUtc(ms: number): string {
  return DateTime.fromMillis(ms, { zone: "utc" }).toFormat("yyyyMMdd'T'HHmmss'Z'");
}

/** Escape text per RFC 5545. */
function esc(text: string): string {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

function vevent(uid: string, summary: string, ms: number, stamp: string): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:${uid}@some-deadlines`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${fmtUtc(ms)}`,
    `DTEND:${fmtUtc(ms)}`,
    `SUMMARY:${esc(summary)}`,
    "END:VEVENT",
  ];
}

/**
 * Build a VCALENDAR feed. Deadlines are emitted as UTC instants (no TZID /
 * VTIMEZONE needed) since we already resolved each to an absolute instant.
 */
export function buildIcs(confs: ProcessedConference[]): string {
  const stamp = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//some-deadlines//EN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(site.title)}`,
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const c of confs) {
    if (c.absDeadlineMs != null) {
      lines.push(
        ...vevent(`${c.id}-abstract`, `${c.title} ${c.year} abstract deadline`, c.absDeadlineMs, stamp),
      );
    }
    if (c.deadlineMs != null) {
      lines.push(...vevent(c.id, `${c.title} ${c.year} deadline`, c.deadlineMs, stamp));
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
