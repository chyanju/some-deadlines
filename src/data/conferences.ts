import yaml from "js-yaml";
import confText from "./conferences.yml?raw";
import typesText from "./types.yml?raw";
import type { Conference, ConfType } from "../types";

// YAML is inlined at build time via Vite's `?raw` import, so this works in both
// `astro dev` and `astro build` (no filesystem reads relative to a bundled module).

/** js-yaml parses unquoted `YYYY-MM-DD` as a Date; normalize back to a string. */
function asDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value == null ? "" : String(value);
}

export const types: ConfType[] = yaml.load(typesText) as ConfType[];
export const typeBySub = new Map(types.map((t) => [t.sub, t]));

const validSubs = new Set(types.map((t) => t.sub));
const REQUIRED = [
  "title",
  "year",
  "id",
  "link",
  "deadline",
  "timezone",
  "sub",
] as const;

function validate(records: Conference[]): Conference[] {
  const seen = new Set<string>();
  for (const c of records) {
    for (const field of REQUIRED) {
      const v = c[field];
      if (v === undefined || v === null || v === "") {
        throw new Error(
          `conferences.yml: record "${c.id ?? c.title ?? "?"}" is missing required field "${field}".`,
        );
      }
    }
    if (seen.has(c.id)) {
      throw new Error(`conferences.yml: duplicate id "${c.id}".`);
    }
    seen.add(c.id);
    for (const s of String(c.sub).split(",").map((x) => x.trim())) {
      if (!validSubs.has(s)) {
        throw new Error(
          `conferences.yml: record "${c.id}" has unknown sub "${s}" ` +
            `(valid: ${[...validSubs].join(", ")}).`,
        );
      }
    }
  }
  return records;
}

const raw = (yaml.load(confText) as Conference[]) ?? [];

/** All active (uncommented) conference records, validated and normalized. */
export const conferences: Conference[] = validate(raw).map((c) => ({
  ...c,
  start: asDateString(c.start),
  end: asDateString(c.end),
}));
