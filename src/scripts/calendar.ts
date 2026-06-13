// Year-calendar view. setupCalendar() wires the grid + year nav and returns a
// render(subs) function the app calls whenever the shared filter changes.

interface CalEvent {
  id: string;
  title: string;
  kind: "deadline" | "conference";
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  color: string; // hex (conference) or "var(--color-danger)" (deadline)
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

/** Wire the calendar; returns a render(subs) callback, or null if not on the page. */
export function setupCalendar(
  onEventClick: (id: string) => void,
): ((subs: string[]) => void) | null {
  const events = readEvents();
  const grid = document.querySelector<HTMLElement>("[data-cal-grid]");
  const yearLabel = document.querySelector<HTMLElement>("[data-cal-year]");
  const prev = document.querySelector<HTMLButtonElement>("[data-cal-prev]");
  const next = document.querySelector<HTMLButtonElement>("[data-cal-next]");
  if (!grid || !yearLabel) return null;

  const years = events.flatMap((e) => [
    Number(e.from.slice(0, 4)),
    Number(e.to.slice(0, 4)),
  ]);
  const thisYear = new Date().getFullYear();
  const minYear = years.length ? Math.min(...years) : thisYear;
  const maxYear = years.length ? Math.max(...years) : thisYear;
  let year = Math.min(Math.max(thisYear, minYear), maxYear);
  let lastSubs: string[] = [];

  const now = new Date();
  const today = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  function renderMonth(y: number, m: number, active: CalEvent[]): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "card p-3";

    const head = document.createElement("div");
    head.className = "eyebrow mb-2 text-center";
    head.textContent = `${MONTHS[m]} ${y}`;
    wrap.appendChild(head);

    const g = document.createElement("div");
    g.className = "grid grid-cols-7 gap-1 text-center text-[10px]";
    for (const d of DOW) {
      const c = document.createElement("div");
      c.className = "py-0.5 font-medium text-text-3";
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
        "relative flex aspect-square items-center justify-center rounded-md text-text-3 transition";
      cell.textContent = String(d);

      if (hasEvents) {
        const ev = evs.find((e) => e.kind === "deadline") ?? evs[0];
        const c = ev.color;
        cell.style.backgroundColor = `color-mix(in oklch, ${c} 18%, var(--color-card))`;
        cell.style.boxShadow = `inset 0 0 0 1.5px color-mix(in oklch, ${c} 42%, transparent)`;
        cell.style.color = `color-mix(in oklch, ${c} 78%, var(--color-text))`;
        cell.classList.add("cursor-pointer", "font-semibold", "hover:brightness-110");
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
        cell.addEventListener("click", () => onEventClick(evs[0].id));
      }

      if (ds === today) {
        cell.classList.add("font-bold", "text-text");
        const dot = document.createElement("span");
        dot.className =
          "absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent";
        cell.appendChild(dot);
      }

      g.appendChild(cell);
    }

    wrap.appendChild(g);
    return wrap;
  }

  function draw(): void {
    const active = events.filter((e) => e.subs.some((s) => lastSubs.includes(s)));
    yearLabel!.textContent = String(year);
    grid!.innerHTML = "";
    for (let m = 0; m < 12; m++) grid!.appendChild(renderMonth(year, m, active));
    if (prev) prev.disabled = year <= minYear;
    if (next) next.disabled = year >= maxYear;
  }

  prev?.addEventListener("click", () => {
    if (year > minYear) {
      year--;
      draw();
    }
  });
  next?.addEventListener("click", () => {
    if (year < maxYear) {
      year++;
      draw();
    }
  });

  return (subs: string[]) => {
    lastSubs = subs;
    draw();
  };
}
