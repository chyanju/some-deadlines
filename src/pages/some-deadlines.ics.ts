import type { APIRoute } from "astro";
import { allConferences } from "../lib/deadlines";
import { buildIcs } from "../lib/ics";

export const GET: APIRoute = () =>
  new Response(buildIcs(allConferences), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
