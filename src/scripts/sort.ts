// List sort order. Two modes (a stateful toolbar toggle):
//   - "deadline" (default): by paper submission deadline; the big figure shows it.
//   - "checkpoint": by each card's nearest upcoming date (abstract / paper /
//     meeting); the big figure shows that nearest one too.
// The mode drives BOTH the order and the big figure (see countdown.ts), via the
// `sort-checkpoint` class on <html>. Sort applies to all cards; the filter only
// controls visibility. Persisted in localStorage.
import { orderList, refreshCountdowns } from "./countdown";
import { STORAGE } from "./storage";

type Mode = "deadline" | "checkpoint";

function getMode(): Mode {
  return localStorage.getItem(STORAGE.sort) === "checkpoint" ? "checkpoint" : "deadline";
}

function apply(m: Mode): void {
  document.documentElement.classList.toggle("sort-checkpoint", m === "checkpoint");
  refreshCountdowns(); // big figures follow the mode
  orderList(); // reorder by the new key
}

let wired = false;

export function initSort(): void {
  apply(getMode());
  if (wired) return;
  wired = true;
  document.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest("[data-sort-toggle]")) return;
    const next: Mode = getMode() === "checkpoint" ? "deadline" : "checkpoint";
    localStorage.setItem(STORAGE.sort, next);
    apply(next);
  });
}
