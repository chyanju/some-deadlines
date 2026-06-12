// Dark-mode toggle. The no-flash class is set by an inline <head> script; this
// wires the toggle button and re-applies the theme after view-transition swaps.

function applyStoredTheme(): void {
  const t = localStorage.getItem("theme");
  const dark =
    t === "dark" ||
    (!t && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function initTheme(): void {
  // Delegated click: survives view-transition swaps (document persists).
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-theme-toggle]");
    if (!btn) return;
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
  // The <html> class is reset to the fetched page on swap; re-apply it.
  document.addEventListener("astro:after-swap", applyStoredTheme);
}
