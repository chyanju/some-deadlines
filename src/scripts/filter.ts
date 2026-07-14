// Category filter dropdown. Selection is session-only (not persisted, no URL
// changes). The menu is portaled to <body> so its backdrop-filter composites over
// the page like the header bar — nesting it under the header's own backdrop-filter
// would weaken the effect.
//
// initFilter runs on EVERY astro:page-load — including bfcache restores (Safari's
// back/forward) and view-transition navigations — so it must be idempotent:
//   - state lives at module scope (survives a re-init);
//   - listeners are delegated on `document` and wired exactly once (so they can't
//     die when the menu is portaled, and don't pile up on each navigation);
//   - the menu is looked up wherever it currently lives, not only under [data-filter]
//     (after the first run it's a child of <body>, not the filter root).
// The previous version re-queried the menu under the root on every init; once it
// had been portaled away that returned null, nulling menuEl and killing the whole
// dropdown — which is why the filter (incl. "Include Closed Deadlines") went dead
// in Safari after a back/forward but kept working in Chrome.

let wired = false;
let menuEl: HTMLElement | null = null;
let buttonEl: HTMLElement | null = null;
let dotEl: HTMLElement | null = null;
let onChangeCb: ((selected: string[], showPast: boolean) => void) | undefined;

let selected: Set<string> | null = null; // null until the first init
let past = false;

function boxes(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>("[data-sub]"));
}
function allSubs(): string[] {
  return boxes()
    .map((b) => b.dataset.sub ?? "")
    .filter(Boolean);
}

function positionMenu(): void {
  if (!menuEl || !buttonEl) return;
  const r = buttonEl.getBoundingClientRect();
  menuEl.style.position = "fixed";
  menuEl.style.top = `${Math.round(r.bottom + 8)}px`;
  menuEl.style.right = `${Math.round(window.innerWidth - r.right)}px`;
  menuEl.style.left = "auto";
  menuEl.style.margin = "0";
  menuEl.style.zIndex = "50";
}
function openMenu(): void {
  if (!menuEl || !buttonEl) return;
  positionMenu();
  menuEl.hidden = false;
  buttonEl.setAttribute("aria-expanded", "true");
}
function closeMenu(): void {
  if (!menuEl || !buttonEl) return;
  menuEl.hidden = true;
  buttonEl.setAttribute("aria-expanded", "false");
}

/** Push current state to the checkboxes + the "changed" dot, and notify. */
function apply(): void {
  if (!selected) return;
  const all = allSubs();
  for (const b of boxes()) b.checked = selected.has(b.dataset.sub ?? "");
  const pastBox = document.querySelector<HTMLInputElement>("[data-show-past]");
  if (pastBox) pastBox.checked = past;
  if (dotEl) dotEl.hidden = !(selected.size !== all.length || past);
  onChangeCb?.([...selected], past);
}

/** Delegated listeners on `document`, wired once. Immune to the menu being
 *  portaled and to initFilter re-running on a later astro:page-load. */
function wireOnce(): void {
  if (wired) return;
  wired = true;

  document.addEventListener("change", (e) => {
    if (!selected) return;
    const t = e.target as HTMLElement;
    if (t.matches?.("[data-show-past]")) {
      past = (t as HTMLInputElement).checked;
      apply();
      return;
    }
    const sub = t.closest?.<HTMLInputElement>("[data-sub]");
    if (sub) {
      if (sub.checked) selected.add(sub.dataset.sub ?? "");
      else selected.delete(sub.dataset.sub ?? "");
      apply();
    }
  });

  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest?.("[data-filter-button]")) {
      if (!menuEl) return;
      if (menuEl.hidden) openMenu();
      else closeMenu();
      return;
    }
    if (selected && t.closest?.("[data-filter-all]")) {
      selected = new Set(allSubs());
      apply();
      return;
    }
    if (selected && t.closest?.("[data-filter-clear]")) {
      selected = new Set();
      apply();
      return;
    }
    // Click outside an open menu (and not on the button) → close it.
    if (menuEl && !menuEl.hidden && !menuEl.contains(t) && !buttonEl?.contains(t)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (menuEl && !menuEl.hidden) positionMenu();
  });
}

/** Wire the filter dropdown. `onChange` runs on init and on every change.
 *  Safe to call on every astro:page-load. */
export function initFilter(
  onChange?: (selected: string[], showPast: boolean) => void,
): void {
  const root = document.querySelector<HTMLElement>("[data-filter]");
  if (!root) return;
  onChangeCb = onChange;
  buttonEl = root.querySelector<HTMLButtonElement>("[data-filter-button]");
  // The menu is portaled to <body> on the first init; on later inits it already
  // lives there, so look it up document-wide (not only under the filter root).
  const menu =
    root.querySelector<HTMLElement>("[data-filter-menu]") ??
    document.querySelector<HTMLElement>("[data-filter-menu]");
  if (menu && menu.parentElement !== document.body) {
    document.body.appendChild(menu);
  }
  menuEl = menu;
  dotEl = root.querySelector<HTMLElement>("[data-filter-dot]");

  // Session-only defaults: all categories on, past off. Initialised once so the
  // selection survives a re-init (bfcache restore / view-transition navigation).
  if (selected === null) selected = new Set(allSubs());

  wireOnce();
  apply();
}
