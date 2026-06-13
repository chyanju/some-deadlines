// A segmented "switch" pill: <div class="tbar-seg" data-seg="NAME"> holding a
// sliding .tbar-thumb and N <button data-seg-btn="VALUE"> options. The thumb is
// positioned by the active option's INDEX (data-active) so one CSS rule covers
// any option count. Shared by the View toggle and the Local/AoE toggle.

function group(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-seg="${name}"]`);
}

/** Reflect `value` as the active option of segment `name` (slides the thumb). */
export function setSegmentValue(name: string, value: string): void {
  const g = group(name);
  if (!g) return;
  g.querySelectorAll<HTMLButtonElement>("[data-seg-btn]").forEach((b, i) => {
    const on = b.dataset.segBtn === value;
    b.setAttribute("aria-pressed", String(on));
    if (on) g.dataset.active = String(i);
  });
}

/** Call `cb(value)` when the user picks an option of segment `name`. */
export function onSegmentClick(name: string, cb: (value: string) => void): void {
  group(name)
    ?.querySelectorAll<HTMLButtonElement>("[data-seg-btn]")
    .forEach((b) =>
      b.addEventListener("click", () => cb(b.dataset.segBtn ?? "")),
    );
}
