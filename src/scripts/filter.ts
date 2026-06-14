// Category filter dropdown. Selection is session-only (not persisted, no URL
// changes). The menu is portaled to <body> so its backdrop-filter composites over
// the page like the header bar — nesting it under the header's own backdrop-filter
// would weaken the effect.

let docWired = false;
let menuEl: HTMLElement | null = null;
let buttonEl: HTMLElement | null = null;

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

function wireDocOnce(): void {
  if (docWired) return;
  docWired = true;
  document.addEventListener("click", (e) => {
    if (!menuEl || menuEl.hidden) return;
    const t = e.target as Node;
    if (!menuEl.contains(t) && !buttonEl?.contains(t)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (menuEl && !menuEl.hidden) positionMenu();
  });
}

/** Wire the filter dropdown. `onChange` runs on init and on every change. */
export function initFilter(
  onChange?: (selected: string[], showPast: boolean) => void,
): void {
  const root = document.querySelector<HTMLElement>("[data-filter]");
  if (!root) return;
  const button = root.querySelector<HTMLButtonElement>("[data-filter-button]");
  const menu = root.querySelector<HTMLElement>("[data-filter-menu]");
  // Portal the menu to <body> (once) to un-nest it from the header's glass.
  if (menu && menu.parentElement !== document.body) {
    document.body.appendChild(menu);
  }
  buttonEl = button;
  menuEl = menu;

  const dot = root.querySelector<HTMLElement>("[data-filter-dot]");
  const pastBox = menu?.querySelector<HTMLInputElement>("[data-show-past]") ?? null;
  const all = allSubs();

  // Session-only defaults: all categories on, past off (no persistence, no URL).
  let selected = new Set(all);
  let past = false;

  const apply = () => {
    for (const b of boxes()) b.checked = selected.has(b.dataset.sub ?? "");
    if (pastBox) pastBox.checked = past;
    if (dot) dot.hidden = !(selected.size !== all.length || past);
    onChange?.([...selected], past);
  };

  for (const b of boxes()) {
    b.addEventListener("change", () => {
      if (b.checked) selected.add(b.dataset.sub ?? "");
      else selected.delete(b.dataset.sub ?? "");
      apply();
    });
  }
  pastBox?.addEventListener("change", () => {
    past = pastBox.checked;
    apply();
  });
  menu?.querySelector("[data-filter-all]")?.addEventListener("click", () => {
    selected = new Set(all);
    apply();
  });
  menu?.querySelector("[data-filter-clear]")?.addEventListener("click", () => {
    selected = new Set();
    apply();
  });

  button?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!menu) return;
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  wireDocOnce();
  apply();
}
