// Deadline time-zone display toggle: Local (browser zone) vs AoE (Anywhere on
// Earth = UTC-12). Default Local. Re-formats every absolute deadline shown via
// [data-dl] (epoch ms); the active mode also shows via the `aoe` class on <html>
// (drives the toolbar icon). Countdowns are durations, so they are unaffected.
import { STORAGE } from "./storage";

type Mode = "local" | "aoe";

function getMode(): Mode {
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
  document.documentElement.classList.toggle("aoe", mode === "aoe");
  for (const el of document.querySelectorAll<HTMLElement>("[data-dl]")) {
    const ms = Number(el.dataset.dl);
    if (ms) el.textContent = format(ms, mode);
  }
}

let wired = false;

export function initTz(): void {
  apply(getMode()); // re-format the (re-rendered) DOM on every page-load
  if (wired) return;
  wired = true;
  // Delegated so it survives view-transition swaps; toggles Local <-> AoE.
  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest("[data-tz-toggle]")) return;
    const next: Mode = getMode() === "aoe" ? "local" : "aoe";
    localStorage.setItem(STORAGE.tz, next);
    apply(next);
  });
}
