// Live countdowns + past/upcoming split, all client-side so they are correct at
// view time (not build time). Cards carry data-deadline (epoch ms) and data-subs.

export function formatRemaining(remainingMs: number): string {
  const s = Math.max(0, Math.floor(remainingMs / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** Localized "in your timezone" full date string for an epoch-ms instant. */
export function localString(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "long",
  });
}

function sortInto(container: HTMLElement | null, direction: 1 | -1): void {
  if (!container) return;
  const items = Array.from(
    container.querySelectorAll<HTMLElement>("[data-conf]"),
  );
  items.sort(
    (a, b) =>
      (Number(a.dataset.deadline) - Number(b.dataset.deadline)) * direction,
  );
  for (const item of items) container.appendChild(item);
}

export function initCountdowns(): void {
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
    const counter = card.querySelector<HTMLElement>("[data-countdown]");
    const local = card.querySelector<HTMLElement>("[data-local]");

    if (!ms) {
      if (counter) counter.textContent = "TBA";
      continue;
    }
    if (local) {
      local.textContent = localString(ms);
    }
    if (ms < now) {
      card.classList.add("is-past");
      if (counter) counter.textContent = "Passed";
      past?.appendChild(card);
    } else {
      upcoming?.appendChild(card);
    }
  }

  sortInto(upcoming, 1); // soonest first
  sortInto(past, -1); // most recent first

  const tick = () => {
    const t = Date.now();
    for (const card of cards) {
      const ms = Number(card.dataset.deadline);
      if (!ms || ms < t) continue;
      const counter = card.querySelector<HTMLElement>("[data-countdown]");
      if (counter) counter.textContent = formatRemaining(ms - t);
    }
  };
  tick();
  window.setInterval(tick, 1000);
}
