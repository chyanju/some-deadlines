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
- **Typography** (self-hosted variable fonts via fontsource): **Source Serif 4**
  (a calm, scholarly display serif — wordmark, titles, headings) + **Geist**
  (body/UI; countdowns and timestamps use Geist with tabular, slashed-zero
  numerals — no monospace).

Design direction — "Calm Editorial Technical" on an Apple **Liquid Glass** material
layer: a fixed ambient mesh (indigo + warm blooms) gives the glass something to
refract; conference cards and the floating header bar / filter popover are
translucent `backdrop-filter` panels with a specular top/rim highlight and soft
depth shadows. One indigo accent; each conference's category colour doubles as its
urgency colour. Tokens live in `src/styles/global.css` (`@theme` for light,
`html.dark` overrides for dark — one set of `bg-card`/`text-text`/… utilities, no
`dark:` variants). The whole glass layer is gated behind `@supports
(backdrop-filter)` and collapses to a flat opaque look under
`prefers-reduced-transparency` (motion is neutralized under `prefers-reduced-motion`).

Niceties: three stateful icon toggles in the header — **dark mode** (sun/moon,
follows system, no flash), **detail** (simple = just the big figure / complex =
all the inline per-deadline countdowns), and **Local / AoE** deadline time zone
(clock/globe) — plus an **Options menu** (categories, an **Include Closed
Deadlines** option, and a **sort** choice: by paper submission deadline, or by
each card's nearest upcoming milestone — which also drives what the big figure
counts to), **View Transitions** (`<ClientRouter />`), an urgency ramp (category
colour intensifies ≤30d, deepens ≤7d), and per-milestone **.ics download** +
**Add to Google Calendar** links. Theme / detail / time-zone / sort choices
persist in `localStorage`; nothing is read from or written to the URL.

## Project structure

```
src/
  types.ts            # Conference + ConfType interfaces (the data model)
  data/
    conferences.yml   # ★ the data — edit this to add/update conferences
    milestone.md      # guide for authoring conferences.yml (which dates to collect)
    types.yml         # subject categories (PL/SE/SECURITY/OS/ARCH/MORE) + colors
    conferences.ts    # loads + validates the YAML, exports typed records
    site.ts           # site config (title, author, GitHub repo, optional GA id)
  lib/                # build-time logic
    milestones.ts     # ★ milestone registry — one entry per dated milestone type
    deadlines.ts      # Luxon: resolve milestones + timezone -> epoch ms + formatting
    icons.ts          # central SVG path set (rendered by Icon.astro)
    ics.ts            # build VCALENDAR feeds
  layouts/Layout.astro          # shared HTML shell (head, header, no-flash, glass filter)
  components/
    Header.astro                # sticky glass bar: wordmark + toolbar slot + theme + GitHub
    ConferenceCard.astro        # one conference (dates, links, milestones, countdowns)
    CategoryFilter.astro        # Options menu: categories, Include Closed
                                #   Deadlines, sort radios (portaled to <body>)
    DeadlineActions.astro       # per-milestone "Add to Google Calendar" + ".ics" icons
    InlineCountdown.astro       # small "(N days left · HH:MM:SS)" countdown cell
    Icon.astro                  # renders one glyph from lib/icons.ts
    IconToggle.astro            # one stateful toolbar toggle (theme / detail / tz)
  scripts/                      # client-side, re-run on every astro:page-load
    app.ts            # orchestrates the page (countdowns + toggles + sort + filter)
    countdown.ts      # live big (mode-aware) + inline countdowns, urgency, orderList
    filter.ts         # category + Closed-submissions filter (session-only, no URL)
    sort.ts           # sort mode (deadline / milestone); drives order + big figure
    toggles.ts        # ★ toggle registry — theme/detail/tz wiring + no-flash script
    tz.ts             # Local / AoE deadline date formatting
    storage.ts        # localStorage keys (one source of truth)
  styles/global.css   # design tokens + component classes + the Liquid Glass layer
  pages/
    index.astro               # the conference list (the whole app) -> /
    conference/[id].ics.ts    # per-milestone calendar file -> /conference/<id>-<kind>.ics
    some-deadlines.ics.ts     # full ICS feed -> /some-deadlines.ics
public/
    favicon.png
```

Two small registries are the main extension points:

- **`lib/milestones.ts`** — to add a milestone type (e.g. camera-ready): add its
  field(s) to `Conference` (`types.ts`), add one entry here, then fill the dates in
  `conferences.yml`. The parser, card rows, calendar `.ics` items, and the
  milestone sort all derive from it.
- **`scripts/toggles.ts`** — the theme / detail / time-zone toggles and the
  pre-paint no-flash script come from one `TOGGLES` list (key · `<html>` class ·
  values). Toolbar glyphs live in `lib/icons.ts`, rendered by `Icon.astro` /
  `IconToggle.astro`.

**Single-page app.** `index.astro` is the whole app: a single filterable list of
conference countdowns, driven by the category filter in the header. Everything
about a conference lives on its card — there is no detail page or drawer. The only
non-HTML routes are the `.ics` endpoints. `scripts/app.ts` orchestrates it; the
client scripts re-run on each `astro:page-load` so they survive View Transitions.

How it fits together: `conferences.yml` is loaded and validated by
`conferences.ts`, enriched in `deadlines.ts` (each deadline resolved to an
absolute epoch-ms instant via Luxon), and baked into the page. Countdowns, the
Local/AoE conversion, and filtering all run client-side — there is no backend.

## Maintaining conference data

**Almost all upkeep is editing one file: `src/data/conferences.yml`.** The dev
server hot-reloads on save. Each conference is one list item:

```yaml
- title: PLDI
  year: 2026
  id: pldi26                       # unique slug -> DOM id / /conference/pldi26.ics
  link: https://pldi26.sigplan.org/
  deadline: '2025-11-13 23:59:59'  # 'YYYY-MM-DD HH:MM:SS' (quoted), or TBA
  abstract_deadline: '2025-11-06 23:59:59'   # optional
  # optional extra milestones (same format; omit if the conference has none):
  #   early_rejection: '...'
  #   rebuttal_start: '...'   rebuttal_end: '...'   # an interval, shown together
  #   notification: '...'
  timezone: UTC-12                 # 'UTC-12'..'UTC+14' or an IANA name
  place: Boulder, Colorado, United States
  date: June 15-19, 2026           # free-text, display only
  start: 2026-06-15                # conference span (optional metadata)
  end: 2026-06-19
  sub: "PL"                        # category code(s); must exist in types.yml
```

Conventions:

- **Delete a conference once the meeting is over.** The conference countdown
  treats `start`..`end` as an interval — it counts down to `start`, shows
  "ongoing" during the meeting, then "ended" once `end` has passed. Only after it
  has **ended** is the record done; remove it then (don't keep it commented out).
  The `# ==== NAME ====` banners are just section headers for scanning the file.
- A conference whose paper deadline has passed but whose meeting is still upcoming
  (or ongoing) stays in the file; it's hidden by default and revealed via the
  Options menu's **Include Closed Deadlines** toggle, sorting to the bottom.
- The loader **validates** on build: a missing required field, an unknown `sub`, or
  a duplicate `id` fails the build with a clear message.
- Extra keys in the YAML (e.g. a legacy `note:`) are ignored — only the fields in
  `Conference` (see `src/types.ts`) are used.

### Categories

Edit `src/data/types.yml` to add/rename a category (`name`, `sub`, `color`); the
Options menu and card badges update automatically.

### Timezones

Write the deadline's timezone as `UTC-12`..`UTC+14` or an IANA name like
`America/New_York`. Luxon resolves both directly — no sign tricks needed.

## License

See [LICENSE](LICENSE).
