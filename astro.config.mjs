// @ts-check
import { defineConfig } from "astro/config";

// Standalone static site. No GitHub Pages / UCSB sub-path: served from root.
// Tailwind v4 is wired via PostCSS (postcss.config.mjs) — the @tailwindcss/vite
// plugin is currently incompatible with Astro 6's Rolldown-based Vite.
export default defineConfig({
  site: "http://localhost:4321",
});
