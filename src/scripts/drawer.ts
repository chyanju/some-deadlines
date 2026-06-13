// In-page conference detail drawer. Built from the #conf-data JSON so clicking a
// card or calendar cell opens detail in place (no route change). Deep-links via
// the URL hash (#id); the static /conference/<id>/ page remains a no-JS fallback.
import { formatClock } from "./countdown";
import { applyTz } from "./tz";

interface Cat {
  sub: string;
  name: string;
  color: string;
}
interface Conf {
  id: string;
  title: string;
  year: number;
  full_name: string;
  link: string;
  place: string;
  date: string;
  paperslink: string;
  pwclink: string;
  deadlineMs: number | null;
  absMs: number | null;
  confTz: string | null;
  absConfTz: string | null;
  dlShort: string | null;
  absShort: string | null;
  cats: Cat[];
  gcal: string | null;
}

let confs: Conf[] = [];
let drawerTimer = 0;
let wired = false;

function readConfs(): Conf[] {
  const el = document.getElementById("conf-data");
  if (!el?.textContent) return [];
  try {
    return JSON.parse(el.textContent) as Conf[];
  } catch {
    return [];
  }
}

function esc(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}

function fact(label: string, valueHtml: string): string {
  return `<div class="flex gap-4 py-2.5"><dt class="eyebrow w-20 shrink-0 pt-0.5">${label}</dt><dd class="min-w-0 break-words text-[0.9375rem] text-text">${valueHtml}</dd></div>`;
}
function link(href: string): string {
  return `<a href="${esc(href)}" target="_blank" rel="noopener" class="text-accent hover:underline">${esc(href)}</a>`;
}
function seg(id: string, label: string, sep: boolean): string {
  const colon = sep
    ? '<div class="text-[clamp(1.75rem,5vw,2.5rem)] leading-none text-text-3">:</div>'
    : "";
  return `${colon}<div class="text-center"><div data-cd="${id}" class="tnum text-[clamp(2rem,7vw,3rem)] leading-none font-semibold text-text">—</div><div class="eyebrow mt-1.5">${label}</div></div>`;
}

function buildContent(c: Conf): string {
  const accent = c.cats[0]?.color ?? "var(--color-border-strong)";
  const badges = c.cats
    .map(
      (t) =>
        `<span class="badge" style="--c:${t.color}" title="${esc(t.name)}">${esc(t.name)}</span>`,
    )
    .join("");
  const maps =
    c.place === "Online"
      ? null
      : `https://maps.google.com/?q=${encodeURIComponent(c.place)}`;

  const facts = [
    fact("Dates", esc(c.date)),
    fact(
      "Place",
      maps
        ? `<a href="${maps}" target="_blank" rel="noopener" class="text-accent hover:underline">${esc(c.place)}</a>`
        : esc(c.place),
    ),
    fact("Website", link(c.link)),
  ];
  if (c.paperslink) facts.push(fact("Papers", link(c.paperslink)));
  if (c.pwclink) facts.push(fact("Code", link(c.pwclink)));

  const absBlock = c.absMs
    ? `<div class="border-t border-border pt-3">
         <div class="eyebrow">Abstract · conference time</div>
         <div class="mt-0.5 tnum text-[0.9375rem] text-text">${esc(c.absConfTz ?? "")}</div>
         <div class="eyebrow mt-2" data-dl-label>Your local time</div>
         <div class="mt-0.5 tnum text-[0.9375rem] text-text" data-dl="${c.absMs}">${esc(c.absShort ?? "—")}</div>
       </div>`
    : "";

  return `
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="font-display text-[1.6rem] leading-tight font-[560] tracking-[-0.015em] text-text">${esc(c.title)} ${c.year}</h2>
        ${c.full_name ? `<p class="mt-1 text-[0.95rem] text-text-2">${esc(c.full_name)}</p>` : ""}
      </div>
      <button type="button" data-drawer-close aria-label="Close" class="-mr-1 rounded-md p-1.5 text-text-3 transition-colors hover:bg-surface hover:text-text">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="mt-2 flex flex-wrap gap-1.5">${badges}</div>

    <div class="cd-subpanel mt-5 rounded-2xl border border-border p-5" style="border-top:3px solid ${accent}; background: color-mix(in oklch, ${accent} 8%, var(--glass-fill))">
      <div data-passed hidden class="text-center font-display text-[1.4rem] font-[500] text-text-2">Deadline passed</div>
      <div data-countdown data-deadline="${c.deadlineMs ?? ""}" class="flex items-start justify-center gap-2 sm:gap-3">
        ${seg("d", "days", false)}${seg("h", "hrs", true)}${seg("m", "min", true)}${seg("s", "sec", true)}
      </div>
    </div>

    <div class="mt-4 space-y-3">
      <div>
        <div class="eyebrow">Paper · conference time</div>
        <div class="mt-0.5 tnum text-[0.9375rem] text-text">${esc(c.confTz ?? "TBA")}</div>
        <div class="eyebrow mt-2" data-dl-label>Your local time</div>
        <div class="mt-0.5 tnum text-[0.9375rem] text-text" data-dl="${c.deadlineMs ?? ""}">${esc(c.dlShort ?? "—")}</div>
      </div>
      ${absBlock}
      ${c.gcal ? `<a href="${esc(c.gcal)}" target="_blank" rel="noopener" class="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition hover:brightness-110">Add to Google Calendar</a>` : ""}
    </div>

    <dl class="mt-5 divide-y divide-border border-t border-border">${facts.join("")}</dl>
  `;
}

function startTick(panel: HTMLElement): void {
  if (drawerTimer) window.clearInterval(drawerTimer);
  const cd = panel.querySelector<HTMLElement>("[data-countdown]");
  const passed = panel.querySelector<HTMLElement>("[data-passed]");
  const ms = Number(cd?.dataset.deadline);
  const seg = (k: string) => panel.querySelector<HTMLElement>(`[data-cd="${k}"]`);
  if (!ms) {
    if (cd) cd.hidden = true;
    if (passed) {
      passed.textContent = "Deadline TBA";
      passed.hidden = false;
    }
    return;
  }
  const render = () => {
    const rem = ms - Date.now();
    if (rem <= 0) {
      if (cd) cd.hidden = true;
      if (passed) {
        passed.textContent = "Deadline passed";
        passed.hidden = false;
      }
      if (drawerTimer) window.clearInterval(drawerTimer);
      return;
    }
    const { days, clock } = formatClock(rem);
    const [hh, mm, ss] = clock.split(":");
    const d = seg("d"),
      h = seg("h"),
      m = seg("m"),
      s = seg("s");
    if (d) d.textContent = String(days);
    if (h) h.textContent = hh;
    if (m) m.textContent = mm;
    if (s) s.textContent = ss;
  };
  render();
  drawerTimer = window.setInterval(render, 1000);
}

function open(id: string): void {
  const root = document.getElementById("drawer");
  const panel = document.getElementById("drawer-panel");
  const c = confs.find((x) => x.id === id);
  if (!root || !panel || !c) return;
  panel.innerHTML = buildContent(c);
  root.hidden = false;
  document.body.style.overflow = "hidden";
  if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
  applyTz();
  startTick(panel);
  panel.scrollTop = 0;
}

function close(): void {
  const root = document.getElementById("drawer");
  if (!root || root.hidden) return;
  root.hidden = true;
  document.body.style.overflow = "";
  if (drawerTimer) {
    window.clearInterval(drawerTimer);
    drawerTimer = 0;
  }
  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }
}

export function openDrawer(id: string): void {
  open(id);
}

export function initDrawer(): void {
  confs = readConfs();
  const root = document.getElementById("drawer");
  if (!root) return;

  if (!wired) {
    wired = true;
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const cardLink = target.closest<HTMLElement>("[data-conf-link]");
      if (cardLink) {
        const id = cardLink.getAttribute("data-conf-link");
        if (id) {
          e.preventDefault();
          open(id);
        }
        return;
      }
      const drawer = document.getElementById("drawer");
      if (drawer && !drawer.hidden) {
        if (target.closest("[data-drawer-close]") || !target.closest("#drawer-panel")) {
          close();
        }
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  const id = location.hash.slice(1);
  if (id && confs.some((c) => c.id === id)) open(id);
}
