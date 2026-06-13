# Some Deadlines

Countdowns to some academic conference deadlines. A standalone static site built
with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com).
Originally adapted from [ai-deadlines](https://github.com/paperswithcode/ai-deadlines);
rewritten from the old Jekyll/jQuery stack.

## Quick start

```bash
npm install
npm run dev       # local dev server at http://localhost:4321
npm run build     # static build into ./dist
npm run preview   # serve ./dist locally to check the production build
npm run check     # type-check (astro check)
```

No deployment is configured — this is a standalone site for local use. To host it
later, serve the static `dist/` folder from any static host.

## Tech stack

- **Astro 6** — static site generator (zero JS shipped by default).
- **Tailwind CSS v4** — styling, wired via PostCSS (`@tailwindcss/postcss`).
  (The `@tailwindcss/vite` plugin is currently incompatible with Astro 6's
  Rolldown-based Vite, so we use the PostCSS integration.)
- **Luxon** — timezone math at build time; the browser ships **no** date library.
- **TypeScript** — typed data model and client scripts.
- **Type system** (self-hosted variable fonts via fontsource): **Source Serif 4**
  (a calm, scholarly display serif — wordmark, titles, headings) + **Geist**
  (body/UI; countdowns and timestamps use Geist with tabular, slashed-zero
  numerals — no monospace).

Design direction — "Calm Editorial Technical" on an Apple **Liquid Glass** material
layer: a fixed ambient mesh (indigo + warm blooms) gives the glass something to
refract; cards, controls, the header bar and the detail drawer are translucent
`backdrop-filter` panels with a specular top/rim highlight and soft depth shadows,
on a four-rung elevation ladder (bg < card < control/header < drawer-over-scrim).
One indigo accent, red reserved for urgency, tamed category colors. Tokens live in
`src/styles/global.css` (`@theme` for light, `html.dark` overrides for dark — one
set of `bg-card`/`text-text`/… utilities, no `dark:` variants). The whole glass
layer is gated behind `@supports (backdrop-filter)` and collapses to the flat
opaque look under `prefers-reduced-transparency` (and motion is neutralized under
`prefers-reduced-motion`).

Niceties: **dark mode** (header toggle, follows system, no flash, `?theme=` URL
override), a **Local / AoE** deadline time-zone toggle (default Local, `?tz=`
override), **View Transitions** (`<ClientRouter />`), a segmented countdown on the
detail page, and an urgency ramp (amber ≤30d, red ≤7d).

## Project structure

```
src/
  data/
    conferences.yml   # ★ the data — edit this to add/update conferences
    types.yml         # subject categories (PL/SE/SECURITY/OS/ARCH/MORE) + colors
    conferences.ts    # loads + validates the YAML, exports typed records
    site.ts           # site config (title, author, optional GA id)
  lib/
    deadlines.ts      # Luxon: parse deadline+timezone -> epoch ms + formatting
    ics.ts            # builds the VCALENDAR feed
  layouts/Layout.astro        # shared HTML shell
  components/                 # Header, Footer, ConferenceCard, CategoryFilter, TzToggle
  scripts/                    # client-side: app, countdown, filter, tz, calendar, drawer
  pages/
    index.astro               # the single-page app (list + calendar views + drawer) -> /
    conference/[id].astro     # static per-conference page — no-JS / deep-link fallback
    some-deadlines.ics.ts     # ICS feed endpoint -> /some-deadlines.ics
public/
    favicon.png
```

**Single-page app.** `index.astro` is the whole app: the **Countdowns** list and
the **Calendar** are two views toggled in place (no routing), the shared filter
drives both, and clicking a conference opens an in-page **drawer** (deep-linked via
`#id`). `scripts/app.ts` orchestrates it.

How it fits together: `conferences.yml` is loaded and validated by
`conferences.ts`, enriched in `deadlines.ts` (each deadline resolved to an
absolute epoch-ms instant via Luxon), and baked into the page as JSON. Countdowns,
the Local/AoE conversion, filtering, the calendar grid, and the detail drawer all
run client-side — there is no backend. (The static `/conference/<id>/` pages remain
as a no-JS fallback and for direct links.)

## Maintaining conference data

**Almost all upkeep is editing one file: `src/data/conferences.yml`.** The dev
server hot-reloads on save. Each conference is one list item:

```yaml
- title: PLDI
  year: 2026
  id: pldi26                       # unique slug -> /conference/pldi26/
  link: https://pldi26.sigplan.org/
  deadline: '2025-11-13 23:59:59'  # 'YYYY-MM-DD HH:MM:SS' (quoted), or TBA
  abstract_deadline: '2025-11-06 23:59:59'   # optional
  timezone: UTC-12                 # 'UTC-12'..'UTC+14' or an IANA name
  place: Boulder, Colorado, United States
  date: June 15-19, 2026           # free-text, display only
  start: 2026-06-15                # conference span (drives the calendar)
  end: 2026-06-19
  sub: "PL"                        # category code(s); must exist in types.yml
  note: <a href='https://pldi26.sigplan.org/'>conference site</a>
```

Optional fields the templates also support: `full_name`, `paperslink`,
`pwclink`, `hindex`.

Conventions:

- **Keep history by commenting out, not deleting.** When a deadline passes, comment
  the old record (`#` each line) and add the new year above it.
- Passed deadlines move to a "Past deadlines" section in the browser automatically.
- The loader **validates** on build: a missing required field, an unknown `sub`, or
  a duplicate `id` fails the build with a clear message.

### Categories

Edit `src/data/types.yml` to add/rename a category (`name`, `sub`, `color`); the
filter chips, badges, and calendar colors update automatically.

### Timezones

Write the deadline's timezone as `UTC-12`..`UTC+14` or an IANA name like
`America/New_York`. Luxon resolves both directly — no sign tricks needed.

## License

See [LICENSE](LICENSE).
