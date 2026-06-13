// Single-page app orchestrator: list + calendar are two views on one page; the
// shared filter drives both; everything lives on this one page (no detail route).
import { initCountdowns } from "./countdown";
import { initFilter } from "./filter";
import { initTz } from "./tz";
import { setupCalendar } from "./calendar";

const VIEW_KEY = "some-deadlines-view";
type View = "list" | "calendar";

function setView(view: View): void {
  document.getElementById("view-list")?.toggleAttribute("hidden", view !== "list");
  document
    .getElementById("view-calendar")
    ?.toggleAttribute("hidden", view !== "calendar");
  for (const b of document.querySelectorAll<HTMLElement>("[data-view-btn]")) {
    b.setAttribute("aria-pressed", String(b.dataset.viewBtn === view));
  }
  const seg = document.querySelector<HTMLElement>('[aria-label="View"]');
  if (seg) seg.dataset.active = view === "calendar" ? "1" : "0";
  localStorage.setItem(VIEW_KEY, view);
}

export function initApp(): void {
  initCountdowns();
  initTz();
  // Clicking a calendar event jumps to that card in the list view (no popup).
  const renderCalendar = setupCalendar((id) => {
    setView("list");
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  initFilter((subs, showPast) => {
    const set = new Set(subs);
    for (const el of document.querySelectorAll<HTMLElement>(
      "#view-list [data-conf]",
    )) {
      const cats = (el.dataset.subs ?? "").split(",").filter(Boolean);
      const catMatch = cats.some((s) => set.has(s));
      const isPast = el.classList.contains("is-past");
      el.hidden = !catMatch || (isPast && !showPast);
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
    renderCalendar?.(subs);
  });

  document.querySelector("[data-show-all]")?.addEventListener("click", () => {
    document.querySelector<HTMLButtonElement>("[data-filter-all]")?.click();
  });

  for (const b of document.querySelectorAll<HTMLElement>("[data-view-btn]")) {
    b.addEventListener("click", () =>
      setView(b.dataset.viewBtn === "calendar" ? "calendar" : "list"),
    );
  }
  const param = new URLSearchParams(location.search).get("view");
  const saved =
    param === "calendar" || param === "list"
      ? param
      : localStorage.getItem(VIEW_KEY);
  setView(saved === "calendar" ? "calendar" : "list");
}
