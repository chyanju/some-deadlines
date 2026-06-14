/** A conference subject/category, defined in src/data/types.yml. */
export interface ConfType {
  /** Full display name, e.g. "Programming Languages". */
  name: string;
  /** Short code used on records and in filters, e.g. "PL". */
  sub: string;
  /** Hex color for badges / calendar events. */
  color: string;
}

/** One conference record as authored in src/data/conferences.yml. */
export interface Conference {
  /** Short name shown on the card, e.g. "PLDI". */
  title: string;
  year: number;
  /** Unique slug; used as the /conference/<id>/ URL and DOM id. */
  id: string;
  /** Official conference website. */
  link: string;
  /** Paper deadline as 'YYYY-MM-DD HH:MM:SS', or 'TBA'. */
  deadline: string;
  /** Optional abstract deadline, same format. */
  abstract_deadline?: string;
  /** Optional early-rejection notification, same format. */
  early_rejection?: string;
  /** Optional author-response (rebuttal) window, same format. Both or neither. */
  rebuttal_start?: string;
  rebuttal_end?: string;
  /** Optional acceptance/decision notification, same format. */
  notification?: string;
  /** Deadline timezone: 'UTC-12'..'UTC+14' or an IANA name. */
  timezone: string;
  place: string;
  /** Free-text conference dates for display, e.g. "June 15-19, 2026". */
  date: string;
  /** Conference span start 'YYYY-MM-DD' (drives the calendar). */
  start: string;
  /** Conference span end 'YYYY-MM-DD'. */
  end: string;
  /** Category code(s); single value or comma-separated, must exist in types.yml. */
  sub: string;
  /** Optional free-text note in the YAML; not rendered. Unknown keys are ignored. */
  note?: string;
}
