// Stateful <html>-class toggles, all driven by ONE registry:
//   • noFlashScript()  → the pre-paint inline script injected in Layout's <head>
//   • initToggles()    → the runtime click wiring (via app.ts on every page-load)
// Each toggle flips one class on <html>; the matching IconToggle button swaps its
// glyph on that class (Tailwind custom-variant). "sort" is pre-paint only — its
// control is radios (wired in sort.ts) — but it rides in the registry so the
// no-flash script stays single-sourced.
import { STORAGE } from "./storage";
import { formatDeadlines } from "./tz";

export interface ToggleDef {
  /** localStorage key. */
  key: string;
  /** <html> class flipped on when active. */
  cls: string;
  /** stored values meaning active / inactive. */
  on: string;
  off: string;
  /** matchMedia query for the default when storage is unset (theme only). */
  media?: string;
  /** click target; omit for pre-paint-only entries (sort). */
  selector?: string;
  /** extra work after (re)applying — tz re-formats the shown dates. */
  onApply?: () => void;
}

export const TOGGLES: ToggleDef[] = [
  { key: STORAGE.theme, cls: "dark", on: "dark", off: "light", media: "(prefers-color-scheme: dark)", selector: "[data-theme-toggle]" },
  { key: STORAGE.mode, cls: "simple", on: "simple", off: "complex", selector: "[data-mode-toggle]" },
  { key: STORAGE.tz, cls: "aoe", on: "aoe", off: "local", selector: "[data-tz-toggle]", onApply: formatDeadlines },
  { key: STORAGE.sort, cls: "sort-milestone", on: "milestone", off: "deadline" }, // pre-paint only
];

const BUTTONS = TOGGLES.filter((d) => d.selector);

function isActive(d: ToggleDef): boolean {
  const v = localStorage.getItem(d.key);
  if (v === d.on) return true;
  if (v === d.off) return false;
  return d.media ? window.matchMedia(d.media).matches : false;
}

function apply(d: ToggleDef): void {
  document.documentElement.classList.toggle(d.cls, isActive(d));
  d.onApply?.();
}

/** (Re)apply the button toggles' <html> classes — a view-transition swap drops them. */
function applyButtons(): void {
  for (const d of BUTTONS) apply(d);
}

let wired = false;

/** Apply the toggle classes now, and (once) wire the delegated click handler. */
export function initToggles(): void {
  applyButtons();
  if (wired) return;
  wired = true;
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    for (const d of BUTTONS) {
      if (!t.closest(d.selector!)) continue;
      localStorage.setItem(d.key, isActive(d) ? d.off : d.on);
      apply(d);
      break;
    }
  });
  document.addEventListener("astro:after-swap", applyButtons);
}

/** Pre-paint inline script body: set every state class from localStorage before
 *  first paint. Standalone (no imports) — built from the registry and injected by
 *  Layout as an is:inline script, so the keys/classes live in exactly one place. */
export function noFlashScript(): string {
  const stmts = TOGGLES.map((d) => {
    const on = JSON.stringify(d.on);
    const cond = d.media
      ? `v===${on}||(!v&&matchMedia(${JSON.stringify(d.media)}).matches)`
      : `v===${on}`;
    return `v=ls.getItem(${JSON.stringify(d.key)});h.classList.toggle(${JSON.stringify(d.cls)},${cond});`;
  });
  return `(()=>{var ls=localStorage,h=document.documentElement,v;${stmts.join("")}})();`;
}
