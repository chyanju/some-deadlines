import type { ProcessedConference } from "./deadlines";

/** One calendar entry: a paper deadline (single day) or a conference's multi-day
 *  span. Built here at build time, baked into the page as JSON, and consumed by
 *  scripts/calendar.ts — both sides share this type so they can't drift. */
export interface CalEvent {
  id: string;
  title: string;
  kind: "deadline" | "conference";
  /** Inclusive range, YYYY-MM-DD. */
  from: string;
  to: string;
  /** Hex (conference span = category colour) or a CSS var (deadline = danger). */
  color: string;
  subs: string[];
  place: string;
  dateLabel: string;
}

const DEADLINE_COLOR = "var(--color-danger)";
const SPAN_FALLBACK = "var(--color-border-strong)";

/** Build the calendar events: a "deadline" marker per (non-TBA) paper deadline
 *  and a "conference" span per record that has start/end dates. */
export function buildCalendarEvents(confs: ProcessedConference[]): CalEvent[] {
  return confs.flatMap((c) => {
    const out: CalEvent[] = [];
    const title = `${c.title} ${c.year}`;
    const base = { id: c.id, title, subs: c.subs, place: c.place, dateLabel: c.date };
    if (!c.isTba) {
      const d = c.deadline.slice(0, 10);
      out.push({ ...base, kind: "deadline", from: d, to: d, color: DEADLINE_COLOR });
    }
    if (c.start && c.end) {
      out.push({
        ...base,
        kind: "conference",
        from: c.start,
        to: c.end,
        color: c.categories[0]?.color ?? SPAN_FALLBACK,
      });
    }
    return out;
  });
}
