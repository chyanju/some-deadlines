// Live countdowns + urgency, client-side so they are correct at view time.
//
// The big figure shows each card's "primary" date for the current sort mode:
//   - "deadline" (default): the paper submission deadline.
//   - "checkpoint": the nearest upcoming date among abstract / paper / meeting.
// orderList() sorts by the same key. Two independent states:
//   - is-closed: paper submission deadline has passed (dim + "Closed submissions"
//     filter), regardless of sort mode.
//   - is-over: the primary date has passed / nothing is upcoming (big shows
//     "Passed"/"ended"). is-soon/is-urgent track the primary's proximity.
// Inline per-deadline countdowns are independent of mode.
// Cards carry data-deadline (paper), data-abs, data-start, data-end (epoch ms).

const URGENT_MS = 7 * 24 * 60 * 60 * 1000; // <= 7 days  -> danger
const SOON_MS = 30 * 24 * 60 * 60 * 1000; // 8..30 days -> warn
let timer = 0;
let cards: HTMLElement[] = [];
let inlineCds: HTMLElement[] = [];

const num = (v?: string): number => Number(v) || 0;

function formatClock(remainingMs: number): { days: number; clock: string } {
  const s = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { days, clock: `${pad(h)}:${pad(m)}:${pad(sec)}` };
}

type Mode = "deadline" | "checkpoint";
const mode = (): Mode =>
  document.documentElement.classList.contains("sort-checkpoint")
    ? "checkpoint"
    : "deadline";

/** The instant the big figure counts to under `m`, or a label when nothing is up. */
function primary(
  card: HTMLElement,
  m: Mode,
  now: number,
): { ms: number } | { label: "Passed" | "ended" | "TBA" } {
  const paper = num(card.dataset.deadline);
  if (m === "checkpoint") {
    const up = [
      num(card.dataset.abs),
      paper,
      num(card.dataset.start),
      num(card.dataset.end),
    ].filter((x) => x && x > now);
    return up.length ? { ms: Math.min(...up) } : { label: "ended" };
  }
  if (!paper) return { label: "TBA" };
  if (paper < now) return { label: "Passed" };
  return { ms: paper };
}

function renderInline(t: number): void {
  for (const el of inlineCds) {
    const ms = num(el.dataset.deadline);
    if (!ms) continue;
    // `end` is set only for the conference (meeting interval [start, end)): a
    // countdown before start, "ongoing" during, "ended" after. Deadlines have no
    // end, so they just go countdown -> "passed".
    const end = num(el.dataset.end);
    const daysEl = el.querySelector<HTMLElement>("[data-inline-days]");
    const clockEl = el.querySelector<HTMLElement>("[data-inline-clock]");
    let days: string;
    let clock = "";
    if (t < ms) {
      const c = formatClock(ms - t);
      days = `${c.days} ${c.days === 1 ? "day" : "days"} left`;
      clock = ` · ${c.clock}`;
    } else if (end && t < end) {
      days = "ongoing";
    } else {
      days = end ? "ended" : "passed";
    }
    if (daysEl) daysEl.textContent = days;
    if (clockEl) clockEl.textContent = clock;
  }
}

function render(now: number): void {
  const m = mode();
  for (const card of cards) {
    const paper = num(card.dataset.deadline);
    card.classList.toggle("is-closed", paper > 0 && paper < now);
    card.classList.remove("is-soon", "is-urgent", "is-over");
    const daysEl = card.querySelector<HTMLElement>("[data-cd-days]");
    const clockEl = card.querySelector<HTMLElement>("[data-cd-clock]");
    const pr = primary(card, m, now);
    if ("ms" in pr) {
      const rem = pr.ms - now;
      if (rem < URGENT_MS) card.classList.add("is-urgent");
      else if (rem < SOON_MS) card.classList.add("is-soon");
      const { days, clock } = formatClock(rem);
      if (daysEl) daysEl.textContent = String(days);
      if (clockEl) clockEl.textContent = clock;
    } else {
      if (pr.label !== "TBA") card.classList.add("is-over");
      if (daysEl) daysEl.textContent = pr.label;
      if (clockEl) clockEl.textContent = "";
    }
    // Mark the inline countdown the big figure is currently counting to (its date
    // equals the primary; for the conference, before-start matches data-deadline,
    // ongoing matches data-end). Gets a small left-pointing marker via CSS.
    const primaryMs = "ms" in pr ? pr.ms : null;
    for (const inline of card.querySelectorAll<HTMLElement>("[data-inline-cd]")) {
      const idl = num(inline.dataset.deadline);
      const iend = num(inline.dataset.end);
      inline.classList.toggle(
        "is-primary",
        primaryMs != null && (idl === primaryMs || iend === primaryMs),
      );
    }
  }
  renderInline(now);
}

function sortKey(
  card: HTMLElement,
  m: Mode,
  now: number,
): { passed: boolean; key: number } {
  const paper = num(card.dataset.deadline);
  if (m === "checkpoint") {
    const dates = [
      num(card.dataset.abs),
      paper,
      num(card.dataset.start),
      num(card.dataset.end),
    ].filter(Boolean);
    const up = dates.filter((x) => x > now);
    if (up.length) return { passed: false, key: Math.min(...up) };
    return { passed: true, key: dates.length ? Math.max(...dates) : 0 };
  }
  if (!paper) return { passed: false, key: Infinity }; // TBA -> end of upcoming
  if (paper < now) return { passed: true, key: paper };
  return { passed: false, key: paper };
}

/** Reorder #list by the current sort mode: upcoming ascending, then passed/ended
 *  at the bottom (most recent first). Sorts ALL cards; the filter only hides. */
export function orderList(): void {
  const list = document.getElementById("list");
  if (!list) return;
  const m = mode();
  const now = Date.now();
  const keyed = Array.from(
    list.querySelectorAll<HTMLElement>("[data-conf]"),
  ).map((card) => ({ card, ...sortKey(card, m, now) }));
  keyed.sort((a, b) =>
    a.passed !== b.passed
      ? a.passed
        ? 1
        : -1
      : a.passed
        ? b.key - a.key
        : a.key - b.key,
  );
  for (const { card } of keyed) list.appendChild(card);
}

/** Re-render the big figures now (e.g., right after the sort mode changes). */
export function refreshCountdowns(): void {
  render(Date.now());
}

export function initCountdowns(): void {
  if (timer) window.clearInterval(timer);
  cards = Array.from(document.querySelectorAll<HTMLElement>("[data-conf]"));
  inlineCds = Array.from(document.querySelectorAll<HTMLElement>("[data-inline-cd]"));
  render(Date.now());
  timer = window.setInterval(() => render(Date.now()), 1000);
}
