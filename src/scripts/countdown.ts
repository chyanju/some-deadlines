// Live countdowns + urgency ramp, client-side so they are correct at view time.
// All conferences live in ONE list (#list): upcoming first (soonest → latest),
// then past ones appended and dimmed via .is-past (no separate section).
// Cards carry data-deadline (epoch ms) and data-subs.

const URGENT_MS = 7 * 24 * 60 * 60 * 1000; // <= 7 days  -> danger
const SOON_MS = 30 * 24 * 60 * 60 * 1000; // 8..30 days -> warn
let timer = 0;

export function formatClock(remainingMs: number): { days: number; clock: string } {
  const s = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { days, clock: `${pad(h)}:${pad(m)}:${pad(sec)}` };
}

export function localString(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function initCountdowns(): void {
  if (timer) window.clearInterval(timer);
  const list = document.getElementById("list");
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-conf]"));
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
      if (clockEl) clockEl.textContent = " ";
      continue;
    }
    if (ms < now) {
      card.classList.add("is-past");
      if (daysEl) daysEl.textContent = "Passed";
    } else {
      const rem = ms - now;
      if (rem < URGENT_MS) card.classList.add("is-urgent");
      else if (rem < SOON_MS) card.classList.add("is-soon");
    }
  }

  // One list: upcoming ascending (soonest first), then past descending.
  if (list) {
    const ordered = cards.slice().sort((a, b) => {
      const ap = a.classList.contains("is-past");
      const bp = b.classList.contains("is-past");
      if (ap !== bp) return ap ? 1 : -1;
      const am = Number(a.dataset.deadline) || (ap ? 0 : Infinity);
      const bm = Number(b.dataset.deadline) || (bp ? 0 : Infinity);
      return ap ? bm - am : am - bm;
    });
    for (const card of ordered) list.appendChild(card);
  }

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
