// Category filter dropdown. State persists to localStorage and ?sub= / ?past=.
// The menu is PORTALED to <body> and positioned fixed under the button, so its
// backdrop-filter composites over the page exactly like the header bar (a menu
// left nested inside the header's backdrop-filter renders as a weaker, more
// transparent glass — moving it out makes the two materials identical).
import { STORAGE } from "./storage";

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

function loadSelected(all: string[]): string[] {
  const q = new URL(location.href).searchParams.get("sub");
  if (q) {
    return q
      .toUpperCase()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE.subs) ?? "null");
    if (Array.isArray(s)) return s as string[];
  } catch {
    /* ignore */
  }
  return [...all];
}

function loadPast(): boolean {
  const q = new URL(location.href).searchParams.get("past");
  if (q != null) return q === "1" || q === "true";
  return localStorage.getItem(STORAGE.past) === "1";
}

function persist(selected: string[], all: string[], past: boolean): void {
  localStorage.setItem(STORAGE.subs, JSON.stringify(selected));
  localStorage.setItem(STORAGE.past, past ? "1" : "0");
  const url = new URL(location.href);
  if (selected.length === all.length) url.searchParams.delete("sub");
  else url.searchParams.set("sub", selected.join(","));
  if (past) url.searchParams.set("past", "1");
  else url.searchParams.delete("past");
  history.replaceState(null, "", url);
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

  let selected = new Set(loadSelected(all).filter((s) => all.includes(s)));
  let past = loadPast();

  const apply = () => {
    for (const b of boxes()) b.checked = selected.has(b.dataset.sub ?? "");
    if (pastBox) pastBox.checked = past;
    if (dot) dot.hidden = !(selected.size !== all.length || past);
    persist([...selected], all, past);
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
