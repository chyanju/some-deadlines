// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Standalone static site. No GitHub Pages / UCSB sub-path: served from root.
export default defineConfig({
  site: "http://localhost:4321",
  vite: {
    // Cast: @tailwindcss/vite ships its own (newer) Vite types than Astro's,
    // which only clash at the type level; the plugin runs fine at build time.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
