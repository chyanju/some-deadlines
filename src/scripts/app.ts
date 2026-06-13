// Single-page app orchestrator: list + calendar are two views on one page; the
// shared filter drives both; clicking a conference opens an in-page drawer.
import { initCountdowns } from "./countdown";
import { initFilter } from "./filter";
import { initTz } from "./tz";
import { setupCalendar } from "./calendar";
import { initDrawer, openDrawer } from "./drawer";

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
  localStorage.setItem(VIEW_KEY, view);
}

export function initApp(): void {
  initCountdowns();
  initTz();
  initDrawer();
  const renderCalendar = setupCalendar(openDrawer);

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
    renderCalendar?.(subs);
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
