# Some Deadlines

Countdown tracker for academic conference deadlines. Static site, built with
Astro + Tailwind CSS v4.

## Develop

```bash
npm install
npm run dev     # dev server with hot reload
npm run build   # static build -> dist/
npm run check   # type-check
```

## Editing conference data

Conferences live in `src/data/conferences.yml`; categories in `src/data/types.yml`.
To add or update a conference, edit `conferences.yml`.

**Read `src/data/milestone.md` first** — it defines which dates to collect, how to
format them, and how to handle the edge cases. An agent updating the data should
follow that guide.
