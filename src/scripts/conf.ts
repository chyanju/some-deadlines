import { formatRemaining, localString } from "./countdown";

/** Drive the single-conference detail page: local-time fills + live countdown. */
export function initConferencePage(): void {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  document.querySelectorAll(".local-tz").forEach((el) => {
    el.textContent = tz;
  });

  for (const sel of ["[data-local-paper]", "[data-local-abs]"]) {
    const el = document.querySelector<HTMLElement>(sel);
    const ms = Number(el?.dataset.ms);
    if (el && ms) el.textContent = localString(ms);
  }

  const counter = document.querySelector<HTMLElement>("[data-countdown]");
  const ms = Number(counter?.dataset.deadline);
  if (counter && ms) {
    const tick = () => {
      const remaining = ms - Date.now();
      counter.textContent =
        remaining > 0 ? formatRemaining(remaining) : "Deadline passed";
    };
    tick();
    window.setInterval(tick, 1000);
  } else if (counter) {
    counter.textContent = "TBA";
  }
}
