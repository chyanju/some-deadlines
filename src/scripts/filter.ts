// Category filter: shared by the index and calendar pages.
// State persists to localStorage and the ?sub= query param.
const KEY = "some-deadlines-subs";

function chips(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-sub]"));
}

function allSubs(): string[] {
  return chips()
    .map((c) => c.dataset.sub ?? "")
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
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(stored)) return stored as string[];
  } catch {
    /* ignore */
  }
  return [...all]; // default: everything selected
}

function persist(selected: string[], all: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(selected));
  const url = new URL(location.href);
  if (selected.length === all.length || selected.length === 0) {
    url.searchParams.delete("sub");
  } else {
    url.searchParams.set("sub", selected.join(","));
  }
  history.replaceState(null, "", url);
}

/** Wire up the filter chips. `onChange` runs once on init and on every change. */
export function initFilter(onChange?: (selected: string[]) => void): void {
  const all = allSubs();
  let selected = new Set(loadSelected(all));

  const apply = () => {
    for (const c of chips()) {
      c.setAttribute("aria-pressed", String(selected.has(c.dataset.sub ?? "")));
    }
    persist([...selected], all);
    onChange?.([...selected]);
  };

  for (const c of chips()) {
    c.addEventListener("click", () => {
      const s = c.dataset.sub ?? "";
      if (selected.has(s)) selected.delete(s);
      else selected.add(s);
      apply();
    });
  }
  document.querySelector("[data-filter-all]")?.addEventListener("click", () => {
    selected = new Set(all);
    apply();
  });
  document.querySelector("[data-filter-clear]")?.addEventListener("click", () => {
    selected = new Set();
    apply();
  });

  apply();
}
