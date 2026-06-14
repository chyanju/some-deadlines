// Single-page app: a filterable list of conference countdowns. The category
// filter drives the list; everything about a conference lives on its card.
import { initCountdowns } from "./countdown";
import { initFilter } from "./filter";
import { initTz } from "./tz";
import { initMode } from "./mode";
import { initSort } from "./sort";

export function initApp(): void {
  initCountdowns();
  initTz();
  initMode();
  initSort();

  // `showPast` reveals "closed submissions" — cards whose paper deadline passed.
  initFilter((subs, showPast) => {
    const set = new Set(subs);
    for (const el of document.querySelectorAll<HTMLElement>("#list [data-conf]")) {
      const cats = (el.dataset.subs ?? "").split(",").filter(Boolean);
      const catMatch = cats.some((s) => set.has(s));
      const isClosed = el.classList.contains("is-closed");
      el.hidden = !catMatch || (isClosed && !showPast);
    }
    // empty state when nothing is visible (e.g. all categories cleared)
    const list = document.getElementById("list");
    const empty = document.getElementById("empty-state");
    if (list && empty) {
      const anyVisible = Array.from(
        list.querySelectorAll<HTMLElement>("[data-conf]"),
      ).some((e) => !e.hidden);
      empty.hidden = anyVisible;
    }
  });

  document.querySelector("[data-show-all]")?.addEventListener("click", () => {
    document.querySelector<HTMLButtonElement>("[data-filter-all]")?.click();
  });
}
