// Live countdowns + past/upcoming split + urgency ramp, all client-side so they
// are correct at view time. Cards carry data-deadline (epoch ms) and data-subs.

const URGENT_MS = 7 * 24 * 60 * 60 * 1000; // <= 7 days  -> danger
const SOON_MS = 30 * 24 * 60 * 60 * 1000; // 8..30 days -> warn
let timer = 0;

/** Split a remaining duration into a whole-days figure and an HH:MM:SS clock. */
export function formatClock(remainingMs: number): { days: number; clock: string } {
  const s = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { days, clock: `${pad(h)}:${pad(m)}:${pad(sec)}` };
}

/** Localized "in your timezone" string for an epoch-ms instant. */
export function localString(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function sortInto(container: HTMLElement | null, direction: 1 | -1): void {
  if (!container) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>("[data-conf]"));
  items.sort(
    (a, b) => (Number(a.dataset.deadline) - Number(b.dataset.deadline)) * direction,
  );
  for (const item of items) container.appendChild(item);
}

export function initCountdowns(): void {
  if (timer) window.clearInterval(timer);
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-conf]"));
  const upcoming = document.getElementById("upcoming");
  const past = document.getElementById("past");
  const now = Date.now();

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  document.querySelectorAll(".local-tz").forEach((el) => {
    el.textContent = tz;
  });

  for (const card of cards) {
    const ms = Number(card.dataset.deadline);
    const daysEl = card.querySelector<HTMLElement>("[data-cd-days]");
    const clockEl = card.querySelector<HTMLElement>("[data-cd-clock]");
    card.classList.remove("is-urgent", "is-soon", "is-past");

    if (!ms) {
      if (daysEl) daysEl.textContent = "TBA";
      if (clockEl) clockEl.textContent = " ";
      upcoming?.appendChild(card);
      continue;
    }
    if (ms < now) {
      card.classList.add("is-past");
      if (daysEl) daysEl.textContent = "Passed";
      past?.appendChild(card);
    } else {
      const rem = ms - now;
      if (rem < URGENT_MS) card.classList.add("is-urgent");
      else if (rem < SOON_MS) card.classList.add("is-soon");
      upcoming?.appendChild(card);
    }
  }

  sortInto(upcoming, 1);
  sortInto(past, -1);

  const tick = () => {
    const t = Date.now();
    for (const card of cards) {
      const ms = Number(card.dataset.deadline);
      if (!ms || ms < t) continue;
      const { days, clock } = formatClock(ms - t);
      const daysEl = card.querySelector<HTMLElement>("[data-cd-days]");
      const clockEl = card.querySelector<HTMLElement>("[data-cd-clock]");
      if (daysEl) daysEl.textContent = String(days);
      if (clockEl) clockEl.textContent = clock;
    }
  };
  tick();
  timer = window.setInterval(tick, 1000);
}
