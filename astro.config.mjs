// @ts-check
import { defineConfig } from "astro/config";

// GitHub Pages project site at https://chyanju.github.io/some-deadlines/ — `base`
// must match the repo name. Tailwind v4 is wired via PostCSS (postcss.config.mjs);
// the @tailwindcss/vite plugin is currently incompatible with Astro 6's Rolldown Vite.
export default defineConfig({
  site: "https://chyanju.github.io",
  base: "/some-deadlines",
});
