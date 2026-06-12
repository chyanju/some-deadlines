import { initFilter } from "./filter";

interface CalEvent {
  id: string;
  title: string;
  kind: "deadline" | "conference";
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  color: string;
  subs: string[];
  place: string;
  dateLabel: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

function readEvents(): CalEvent[] {
  const el = document.getElementById("cal-data");
  if (!el?.textContent) return [];
  try {
    return JSON.parse(el.textContent) as CalEvent[];
  } catch {
    return [];
  }
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function initCalendar(): void {
  const events = readEvents();
  const grid = document.querySelector<HTMLElement>("[data-cal-grid]");
  const yearLabel = document.querySelector<HTMLElement>("[data-cal-year]");
  const prev = document.querySelector<HTMLButtonElement>("[data-cal-prev]");
  const next = document.querySelector<HTMLButtonElement>("[data-cal-next]");
  if (!grid || !yearLabel) return;

  const years = events.flatMap((e) => [
    Number(e.from.slice(0, 4)),
    Number(e.to.slice(0, 4)),
  ]);
  const thisYear = new Date().getFullYear();
  const minYear = years.length ? Math.min(...years) : thisYear;
  const maxYear = years.length ? Math.max(...years) : thisYear;
  let year = Math.min(Math.max(thisYear, minYear), maxYear);
  let selected = new Set<string>();

  const now = new Date();
  const today = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  function renderMonth(y: number, m: number, active: CalEvent[]): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "rounded-lg border border-gray-200 bg-white p-3";

    const head = document.createElement("div");
    head.className = "mb-2 text-center text-sm font-semibold text-gray-700";
    head.textContent = `${MONTHS[m]} ${y}`;
    wrap.appendChild(head);

    const g = document.createElement("div");
    g.className = "grid grid-cols-7 gap-0.5 text-center text-[10px]";
    for (const d of DOW) {
      const c = document.createElement("div");
      c.className = "py-0.5 font-medium text-gray-400";
      c.textContent = d;
      g.appendChild(c);
    }

    const firstDow = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < firstDow; i++) g.appendChild(document.createElement("div"));

    for (let d = 1; d <= days; d++) {
      const ds = ymd(y, m, d);
      const evs = active.filter((e) => e.from <= ds && ds <= e.to);
      const hasEvents = evs.length > 0;
      const cell = document.createElement(hasEvents ? "button" : "div");
      cell.className =
        "flex aspect-square items-center justify-center rounded-sm";
      cell.textContent = String(d);

      if (ds === today) cell.classList.add("ring-1", "ring-gray-500", "font-bold");

      if (hasEvents) {
        const deadline = evs.find((e) => e.kind === "deadline");
        (cell as HTMLElement).style.backgroundColor = deadline
          ? deadline.color
          : evs[0].color;
        cell.classList.add("cursor-pointer", "font-medium", "text-white");
        cell.setAttribute(
          "title",
          evs
            .map((e) =>
              e.kind === "deadline"
                ? `${e.title} deadline — ${e.place}`
                : `${e.title} (${e.dateLabel}) — ${e.place}`,
            )
            .join("\n"),
        );
        (cell as HTMLButtonElement).type = "button";
        cell.addEventListener("click", () => {
          location.href = `/conference/${evs[0].id}/`;
        });
      } else {
        cell.classList.add("text-gray-500");
      }
      g.appendChild(cell);
    }

    wrap.appendChild(g);
    return wrap;
  }

  function render(): void {
    const active = events.filter((e) => e.subs.some((s) => selected.has(s)));
    yearLabel!.textContent = String(year);
    grid!.innerHTML = "";
    for (let m = 0; m < 12; m++) grid!.appendChild(renderMonth(year, m, active));
    if (prev) prev.disabled = year <= minYear;
    if (next) next.disabled = year >= maxYear;
  }

  prev?.addEventListener("click", () => {
    if (year > minYear) {
      year--;
      render();
    }
  });
  next?.addEventListener("click", () => {
    if (year < maxYear) {
      year++;
      render();
    }
  });

  initFilter((subs) => {
    selected = new Set(subs);
    render();
  });
}
