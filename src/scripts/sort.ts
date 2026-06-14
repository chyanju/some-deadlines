// List sort order — chosen in the filter/settings menu ([data-sort] radios). Two
// modes:
//   - "deadline" (default): by paper submission deadline; the big figure shows it.
//   - "milestone": by each card's nearest upcoming date (abstract / paper /
//     meeting); the big figure shows that nearest one too.
// The mode drives BOTH the order and the big figure (see countdown.ts), via the
// `sort-milestone` class on <html>. Sort applies to all cards; the filter only
// controls visibility. Persisted in localStorage.
import { orderList, refreshCountdowns } from "./countdown";
import { STORAGE } from "./storage";

type Mode = "deadline" | "milestone";

function getMode(): Mode {
  return localStorage.getItem(STORAGE.sort) === "milestone" ? "milestone" : "deadline";
}

function apply(m: Mode): void {
  document.documentElement.classList.toggle("sort-milestone", m === "milestone");
  for (const r of document.querySelectorAll<HTMLInputElement>("[data-sort]")) {
    r.checked = r.dataset.sort === m;
  }
  refreshCountdowns(); // big figures follow the mode
  orderList(); // reorder by the new key
}

let wired = false;

export function initSort(): void {
  apply(getMode());
  if (wired) return;
  wired = true;
  document.addEventListener("change", (e) => {
    const r = (e.target as HTMLElement).closest<HTMLInputElement>("[data-sort]");
    if (!r) return;
    const next: Mode = r.dataset.sort === "milestone" ? "milestone" : "deadline";
    localStorage.setItem(STORAGE.sort, next);
    apply(next);
  });
}
