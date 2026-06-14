// Detail-level toggle: "complex" (default) shows the inline per-deadline
// countdowns; "simple" hides them so only the big figure remains. Persisted;
// applied via the `simple` class on <html> (see global.css). No DOM rewrite — the
// CSS does the hiding and re-columns the deadline grid.
import { STORAGE } from "./storage";

type Mode = "simple" | "complex";

function getMode(): Mode {
  return localStorage.getItem(STORAGE.mode) === "simple" ? "simple" : "complex";
}

function apply(mode: Mode): void {
  document.documentElement.classList.toggle("simple", mode === "simple");
}

let wired = false;

export function initMode(): void {
  apply(getMode());
  if (wired) return;
  wired = true;
  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest("[data-mode-toggle]")) return;
    const next: Mode = getMode() === "simple" ? "complex" : "simple";
    localStorage.setItem(STORAGE.mode, next);
    apply(next);
  });
}
