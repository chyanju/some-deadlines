/** Site-wide configuration. */
export const site = {
  title: "Some Deadlines",
  description: "Countdowns to some academic conference deadlines",
  author: "Yanju Chen",
  /** GitHub repo, shown as an icon link in the header. Empty to hide. */
  githubRepo: "chyanju/some-deadlines",
  /** Optional Google Analytics (GA4) measurement id. Empty disables analytics. */
  gaId: "",
  /** Zone label shown before the browser's local zone is detected client-side. */
  defaultTimezone: "America/New_York",
} as const;
