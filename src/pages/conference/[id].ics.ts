import type { APIRoute, GetStaticPaths } from "astro";
import { allConferences } from "../../lib/deadlines";
import type { ProcessedConference } from "../../lib/deadlines";
import { buildIcs } from "../../lib/ics";

// One .ics per conference -> /conference/<id>.ics
export const getStaticPaths = (() =>
  allConferences.map((c) => ({
    params: { id: c.id },
    props: { conf: c },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { conf } = props as { conf: ProcessedConference };
  return new Response(buildIcs([conf]), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
};
