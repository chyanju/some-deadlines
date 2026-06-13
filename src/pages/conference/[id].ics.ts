import type { APIRoute, GetStaticPaths } from "astro";
import { allConferences, deadlineItems } from "../../lib/deadlines";
import { buildIcs } from "../../lib/ics";

// One .ics per deadline -> /conference/<id>-paper.ics and /conference/<id>-abstract.ics
export const getStaticPaths = (() =>
  allConferences.flatMap((c) =>
    deadlineItems(c).map((d) => ({
      params: { id: d.uid },
      props: { uid: d.uid, summary: d.summary, ms: d.ms },
    })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { uid, summary, ms } = props as { uid: string; summary: string; ms: number };
  return new Response(buildIcs([{ uid, summary, ms }]), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
};
