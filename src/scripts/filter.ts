// Category filter as a dropdown menu, shared by the index and calendar pages.
// State persists to localStorage and the ?sub= / ?past= query params.
const KEY = "some-deadlines-subs";
const PAST_KEY = "some-deadlines-past";

let docWired = false;

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
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(s)) return s as string[];
  } catch {
    /* ignore */
  }
  return [...all];
}

function loadPast(): boolean {
  const q = new URL(location.href).searchParams.get("past");
  if (q != null) return q === "1" || q === "true";
  return localStorage.getItem(PAST_KEY) === "1";
}

function persist(selected: string[], all: string[], past: boolean): void {
  localStorage.setItem(KEY, JSON.stringify(selected));
  localStorage.setItem(PAST_KEY, past ? "1" : "0");
  const url = new URL(location.href);
  if (selected.length === all.length) url.searchParams.delete("sub");
  else url.searchParams.set("sub", selected.join(","));
  if (past) url.searchParams.set("past", "1");
  else url.searchParams.delete("past");
  history.replaceState(null, "", url);
}

function closeMenu(): void {
  const root = document.querySelector<HTMLElement>("[data-filter]");
  const menu = root?.querySelector<HTMLElement>("[data-filter-menu]");
  const button = root?.querySelector<HTMLElement>("[data-filter-button]");
  if (menu) menu.hidden = true;
  button?.setAttribute("aria-expanded", "false");
}

function wireDocOnce(): void {
  if (docWired) return;
  docWired = true;
  document.addEventListener("click", (e) => {
    const root = document.querySelector<HTMLElement>("[data-filter]");
    const menu = root?.querySelector<HTMLElement>("[data-filter-menu]");
    if (root && menu && !menu.hidden && !root.contains(e.target as Node)) {
      closeMenu();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
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
  const summary = root.querySelector<HTMLElement>("[data-filter-summary]");
  const dot = root.querySelector<HTMLElement>("[data-filter-dot]");
  const pastBox = root.querySelector<HTMLInputElement>("[data-show-past]");
  const all = allSubs();

  let selected = new Set(loadSelected(all).filter((s) => all.includes(s)));
  let past = loadPast();

  const apply = () => {
    for (const b of boxes()) b.checked = selected.has(b.dataset.sub ?? "");
    if (pastBox) pastBox.checked = past;
    if (summary) {
      summary.textContent =
        selected.size === all.length
          ? "All categories"
          : selected.size === 0
            ? "No categories"
            : `${selected.size} categor${selected.size === 1 ? "y" : "ies"}`;
    }
    // active-filter indicator dot (categories narrowed, or past shown)
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
  root.querySelector("[data-filter-all]")?.addEventListener("click", () => {
    selected = new Set(all);
    apply();
  });
  root.querySelector("[data-filter-clear]")?.addEventListener("click", () => {
    selected = new Set();
    apply();
  });

  button?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!menu) return;
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
  });

  wireDocOnce();
  apply();
}
