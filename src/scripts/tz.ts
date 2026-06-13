// Deadline time-zone display toggle: Local (browser zone) vs AoE (Anywhere on
// Earth = UTC-12). Default Local. Re-formats every absolute deadline shown via
// [data-dl] (epoch ms). Countdowns are durations, so they are unaffected.
import { setSegmentValue, onSegmentClick } from "./segment";
import { STORAGE } from "./storage";

type Mode = "local" | "aoe";

function getMode(): Mode {
  const q = new URLSearchParams(location.search).get("tz");
  if (q === "aoe" || q === "local") return q;
  return localStorage.getItem(STORAGE.tz) === "aoe" ? "aoe" : "local";
}

const BASE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

function format(ms: number, mode: Mode): string {
  if (mode === "aoe") {
    return (
      new Date(ms).toLocaleString("en-GB", { ...BASE, timeZone: "Etc/GMT+12" }) +
      " AoE"
    );
  }
  return new Date(ms).toLocaleString("en-GB", { ...BASE, timeZoneName: "short" });
}

function apply(mode: Mode): void {
  for (const el of document.querySelectorAll<HTMLElement>("[data-dl]")) {
    const ms = Number(el.dataset.dl);
    if (ms) el.textContent = format(ms, mode);
  }
  setSegmentValue("tz", mode);
}

export function initTz(): void {
  apply(getMode());
  onSegmentClick("tz", (v) => {
    const mode: Mode = v === "aoe" ? "aoe" : "local";
    localStorage.setItem(STORAGE.tz, mode);
    apply(mode);
  });
}
