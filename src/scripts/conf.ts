import { formatClock, localString } from "./countdown";

let timer = 0;

/** Drive the single-conference detail page: local-time fills + segmented hero countdown. */
export function initConferencePage(): void {
  if (timer) window.clearInterval(timer);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  document.querySelectorAll(".local-tz").forEach((el) => {
    el.textContent = tz;
  });

  for (const sel of ["[data-local-paper]", "[data-local-abs]"]) {
    const el = document.querySelector<HTMLElement>(sel);
    const ms = Number(el?.dataset.ms);
    if (el && ms) el.textContent = localString(ms);
  }

  const hero = document.querySelector<HTMLElement>("[data-countdown]");
  const passed = document.querySelector<HTMLElement>("[data-passed]");
  const dEl = document.querySelector<HTMLElement>('[data-cd="d"]');
  const hEl = document.querySelector<HTMLElement>('[data-cd="h"]');
  const mEl = document.querySelector<HTMLElement>('[data-cd="m"]');
  const sEl = document.querySelector<HTMLElement>('[data-cd="s"]');
  const ms = Number(hero?.dataset.deadline);

  if (!ms) {
    if (hero) hero.hidden = true;
    if (passed) {
      passed.textContent = "Deadline TBA";
      passed.hidden = false;
    }
    return;
  }

  const render = () => {
    const rem = ms - Date.now();
    if (rem <= 0) {
      if (hero) hero.hidden = true;
      if (passed) {
        passed.textContent = "Deadline passed";
        passed.hidden = false;
      }
      if (timer) window.clearInterval(timer);
      return;
    }
    const { days, clock } = formatClock(rem);
    const [hh, mm, ss] = clock.split(":");
    if (dEl) dEl.textContent = String(days);
    if (hEl) hEl.textContent = hh;
    if (mEl) mEl.textContent = mm;
    if (sEl) sEl.textContent = ss;
  };

  render();
  timer = window.setInterval(render, 1000);
}
