// localStorage keys — one source of truth so persisted state can't drift between
// scripts. The no-flash theme bootstrap in Layout.astro is inline and standalone,
// so it repeats the "theme" literal by necessity (keep the two in sync).
export const STORAGE = {
  theme: "theme",
  tz: "some-deadlines-tz",
} as const;
