// Deadline time-zone display toggle: Local (browser zone) vs AoE (Anywhere on
// Earth = UTC-12). Default Local. Affects every absolute deadline shown via
// [data-dl] (epoch ms) and relabels [data-dl-label]. Countdowns are durations,
// so they are unaffected.
const KEY = "some-deadlines-tz";
type Mode = "local" | "aoe";

function getMode(): Mode {
  const q = new URLSearchParams(location.search).get("tz");
  if (q === "aoe" || q === "local") return q;
  return localStorage.getItem(KEY) === "aoe" ? "aoe" : "local";
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
  return new Date(ms).toLocaleString("en-GB", {
    ...BASE,
    timeZoneName: "short",
  });
}

function apply(mode: Mode): void {
  for (const el of document.querySelectorAll<HTMLElement>("[data-dl]")) {
    const ms = Number(el.dataset.dl);
    if (ms) el.textContent = format(ms, mode);
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-dl-label]")) {
    el.textContent = mode === "aoe" ? "Anywhere on Earth (AoE)" : "Your local time";
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>(
    "[data-tz-toggle] button",
  )) {
    b.setAttribute("aria-pressed", String(b.dataset.tz === mode));
  }
  const seg = document.querySelector<HTMLElement>("[data-tz-toggle]");
  if (seg) seg.dataset.active = mode === "aoe" ? "1" : "0";
}

/** Re-format all [data-dl] nodes for the current mode (call after injecting DOM). */
export function applyTz(): void {
  apply(getMode());
}

export function initTz(): void {
  let mode = getMode();
  apply(mode);
  for (const b of document.querySelectorAll<HTMLButtonElement>(
    "[data-tz-toggle] button",
  )) {
    b.addEventListener("click", () => {
      mode = b.dataset.tz === "aoe" ? "aoe" : "local";
      localStorage.setItem(KEY, mode);
      apply(mode);
    });
  }
}
