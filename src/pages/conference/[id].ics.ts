import type { APIRoute, GetStaticPaths } from "astro";
import { allConferences, deadlineItems } from "../../lib/deadlines";
import { buildIcs } from "../../lib/ics";

// One .ics per milestone -> /conference/<id>-paper.ics, -abstract.ics,
// -early-reject.ics, -rebuttal.ics, -notification.ics
export const getStaticPaths = (() =>
  allConferences.flatMap((c) =>
    deadlineItems(c).map((d) => ({
      params: { id: d.uid },
      props: { uid: d.uid, summary: d.summary, ms: d.ms, endMs: d.endMs, tz: d.tz },
    })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { uid, summary, ms, endMs, tz } = props as {
    uid: string;
    summary: string;
    ms: number;
    endMs?: number | null;
    tz: string;
  };
  return new Response(buildIcs([{ uid, summary, ms, endMs, tz }]), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
};
