// Deadline time-zone display: re-format every [data-dl] timestamp into the active
// zone — Local (browser) or AoE (Anywhere on Earth = UTC-12). The Local/AoE toggle
// itself is wired generically in toggles.ts; this is just the formatting it
// triggers (and on each load). Countdowns are durations, so they are unaffected.
import { STORAGE } from "./storage";

const BASE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

function format(ms: number, aoe: boolean): string {
  if (aoe) {
    return (
      new Date(ms).toLocaleString("en-GB", { ...BASE, timeZone: "Etc/GMT+12" }) +
      " AoE"
    );
  }
  return new Date(ms).toLocaleString("en-GB", { ...BASE, timeZoneName: "short" });
}

/** Re-format every shown deadline timestamp ([data-dl]) into the active zone. */
export function formatDeadlines(): void {
  const aoe = localStorage.getItem(STORAGE.tz) === "aoe";
  for (const el of document.querySelectorAll<HTMLElement>("[data-dl]")) {
    const ms = Number(el.dataset.dl);
    if (ms) el.textContent = format(ms, aoe);
  }
}
