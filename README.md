# Some Deadlines

Adapted from [ai-deadlines](https://github.com/paperswithcode/ai-deadlines) with small glitches fixed. Now you can put it under website sub-folders.

## Quick Commands

```bash
# for deployment
# also uncomment GA in config
bundle exec jekyll build -d <target_directory> -b "https://sites.cs.ucsb.edu/~yanju/deadlines"
# e.g.
bundle exec jekyll build -d ./deadlines -b "https://sites.cs.ucsb.edu/~yanju/deadlines"
# e.g.
bundle exec jekyll build -d ./deadlines -b "https://chyanju.github.io/deadlines"
```

```bash
# local config
bundle config set path 'vendor/bundle'
bundle add csv
bundle add logger
bundle install

# for local testing
bundle exec jekyll serve -b ""
```

## Maintaining Conference Data

**99% of upkeep is editing one file: [`_data/conferences.yml`](_data/conferences.yml).**
Everything else (countdown cards, the calendar view, the per-conference page, and
the `.ics` feed) is generated from it at build time. Workflow:

1. Edit `_data/conferences.yml`.
2. Preview locally: `bundle exec jekyll serve -b ""` → open http://localhost:4000.
3. Build + deploy with one of the commands at the top of this file.

### Record schema

Each conference is one list item. Fields actually used today:

| Field               | Required | Example                              | Notes |
|---------------------|----------|--------------------------------------|-------|
| `title`             | yes      | `PLDI`                               | Short name shown on the card. |
| `year`              | yes      | `2026`                               | |
| `id`                | yes      | `pldi26`                             | **Unique slug.** Used as the DOM anchor and the `/conference?id=` URL. Don't reuse across years. |
| `link`              | yes      | `https://pldi26.sigplan.org/`        | Official site (globe icon). |
| `deadline`          | yes      | `'2025-11-13 23:59:59'`              | Paper deadline, `'YYYY-MM-DD HH:MM:SS'` (quoted). Use `TBA` if unknown. |
| `abstract_deadline` | optional | `'2025-11-06 23:59:59'`              | Abstract deadline; omit if none. |
| `timezone`          | yes      | `UTC-12`                             | See timezone note below. |
| `place`             | yes      | `Boulder, Colorado, United States`   | Linked to Google Maps (`Online` is special-cased). |
| `date`              | yes      | `June 15-19, 2026`                   | Free-text conference dates (display only). |
| `start` / `end`     | yes      | `2026-06-15` / `2026-06-19`          | `YYYY-MM-DD`; drives the **calendar** event span. |
| `sub`               | yes      | `"PL"`                               | Category — must be a valid `sub` (see below). |
| `note`              | yes      | `<a href='...'>conference site</a>`  | Free-text/HTML note under the card. |

Optional fields the templates already support but the current data doesn't use —
add them when relevant: `full_name` (long name on the detail page),
`paperslink` (accepted-papers list), `pwclink` (Papers with Code), `hindex`
(shown in the calendar hover card).

### Conventions

- **Keep history by commenting out, not deleting.** When a conference's deadline
  passes, leave the old record in place but comment it out (`#` every line) and add
  the new year's record above it. See the PLDI/ICSE blocks for the pattern.
- **Newest record on top** within each conference's block.
- A passed deadline auto-moves to the "Past Events" section client-side — you don't
  need to move it manually; commenting out is only for keeping the file tidy.

### Categories (`sub`)

Valid values come from [`_data/types.yml`](_data/types.yml): `PL`, `SE`,
`SECURITY`, `OS`, `ARCH`, `MORE`. To add a new category, add an entry to
`types.yml` (with `name`, `sub`, and a `color`) — the filter dropdown, badges,
and calendar colors pick it up automatically.

### Timezones

Write the deadline's timezone as `UTC-12` … `UTC+14`, or any IANA name like
`America/New_York`. Note the deliberate sign convention: `UTC-12` is mapped to
the IANA `Etc/GMT+12` zone (IANA inverts the sign) by `addUtcTimeZones()` in
[`_includes/utils.js`](_includes/utils.js) and by the `.ics` layout. Just match
the conference website's stated timezone and the conversion is handled for you.

### Optional: sort/clean helper

[`utils/process.py`](utils/process.py) reads `../_data/conferences.yml`, sorts by
absolute deadline, and writes `sorted_data.yml` / `cleaned_data.yml` for you to
review and copy back. Requires `pyyaml` and `pytz`. It is a maintainer tool only
and is excluded from the published site.
