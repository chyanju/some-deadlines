import type { APIRoute } from "astro";
import { allConferences, deadlineItems } from "../lib/deadlines";
import { buildIcs } from "../lib/ics";

// Full feed: every milestone (paper, abstract, early-reject, rebuttal,
// notification) across all conferences.
export const GET: APIRoute = () =>
  new Response(buildIcs(allConferences.flatMap(deadlineItems)), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
