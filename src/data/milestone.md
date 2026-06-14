# Milestone collection guide

The playbook for updating `conferences.yml`. **Read this before adding or refreshing any
conference.** It defines which dates to collect, which to deliberately skip, where to look, and
how to handle the messy real-world cases.

---

## 1. The one rule: collect only *decisive* milestones

A date earns a place in the tracker only if it can **directly decide the paper's fate** — a bad
outcome (or a missed date) at that point can *end* the paper's chances, or it is the *binding*
accept/reject decision.

Test any date you find against this:

> **"If this date passes badly, can the paper be dead — or is this THE accept/reject call?"**
> Yes → collect. It's a formality nearly every surviving paper clears → skip.

That single test is the whole point of this file. When a CFP lists ten dates, most are noise;
this rule is how you keep the ~3–5 that actually matter.

---

## 2. What to collect → which field

| Milestone | Field(s) | Why it's decisive |
|---|---|---|
| Abstract submission | `abstract_deadline` | miss it → usually barred from submitting the paper |
| Full paper submission | `deadline` (always present) | miss it → no submission, no chance |
| Early reject | `early_rejection` | rejected here → the paper is dead |
| Author response / rebuttal **period** | `rebuttal_start` + `rebuttal_end` | your response can swing the decision |
| Decision / acceptance notification | `notification` | THE accept/reject call |

- **All submission deadlines are collected.** In practice only two kinds appear: *abstract* and
  *full paper*. If a venue has another submission type, judge it by the rule in §1.
- **Rebuttal is an interval** — it needs both `rebuttal_start` and `rebuttal_end` (both or neither).

---

## 3. What to deliberately NOT collect

- **Camera-ready / final-version due** — not decisive; almost everyone who reaches it is already in.
- **Revision deadlines** — major/minor revision due, "revise & resubmit" re-submission. These come
  *after* a decision and are formalities, not gates on acceptance.
- **"Final acceptance" that follows a *conditional* accept** — this is camera-ready / minor-revision
  in nature. Keep only the **first** binding decision as `notification`; drop the later "final
  acceptance".
  - *Example — UIST 2026:* keep "conditional accept/reject" (Jun 27) as `notification`; **skip** the
    later "final acceptance" (Jul 31).
- Registration, poster / workshop / tutorial tracks, artifact-evaluation dates, etc.

Rationale to carry in your head: by camera-ready / final-acceptance time the paper is essentially in,
so those dates have negligible bearing on *whether* it's accepted — exactly what makes them non-decisive.

---

## 4. Which conferences to track (by category)

**No links here on purpose** — official URLs change every year and the patterns are inconsistent.
Find the current site by searching e.g. `"<conf> <year> call for papers"` or `"<conf> <year>
important dates"`, and confirm you're on the **official** page for the **right edition** (see §8.1).

Categories (use the code in the `sub` field):

- **Programming Languages (PL)** — PLDI, POPL, OOPSLA, ECOOP, ICFP, CAV
- **Software Engineering (SE)** — ICSE, FSE, ASE, ISSTA
- **Security (SECURITY)** — IEEE S&P (Oakland), ACM CCS, NDSS, USENIX Security
- **Operating Systems (OS)** — SOSP, OSDI
- **Computer Architecture (ARCH)** — ASPLOS
- **More (MORE)** — CHI, UIST, SBC

This is the set tracked today. Adding a venue is a commitment to keep it current — don't add one
casually (see §8.7).

---

## 5. Cycles, rounds, multiple deadlines

Many venues open several submission opportunities per year. **Record each as its own entry**, and
**anchor every milestone to the same cycle as that entry's paper deadline** — never mix two cycles'
dates into one record.

- **Security — "cycles":** S&P First / Second deadline · CCS First / Second review cycle ·
  NDSS Summer / Fall · USENIX Security Cycle 1 / 2.
- **PL — "rounds":** OOPSLA Round 1 / 2 · ECOOP Round 1 / 2.
- **Architecture:** ASPLOS spring / fall cycles.
- **PACMPL venues** (PLDI / POPL / OOPSLA / ICFP / ECOOP) usually run a two-round review. The binding
  `notification` is the **first** author notification (conditional accept / reject) — *not* the later
  revision deadline or final-acceptance step (see §3).

---

## 6. Sourcing — official only

- Use **only the official conference page** (its CFP / "Important Dates" / "Dates" page).
- **Never** trust aggregators (wikicfp, mirror lists, etc.) — they are frequently wrong, and a wrong
  date in a deadline tracker is worse than a missing one.
- For each date, note the official source URL it came from, so the result can be reviewed.
- If a date isn't on the official page, it does not go in. **Never guess or infer.**

---

## 7. Format & timezone

- `'YYYY-MM-DD HH:MM:SS'`, quoted, in the conference's **own** `timezone`. `AoE` = Anywhere on Earth = `UTC-12`.
- **Submission deadlines:** use the official clock time (usually `23:59:59` AoE).
- **`notification` / `early_rejection`:** usually published as a bare date → store at `23:59:59`
  (end of day) so it doesn't read as past too early.
- **Rebuttal window "A–B":** `rebuttal_start: 'A 00:00:00'`, `rebuttal_end: 'B 23:59:59'`.
- Not-yet-announced dates → `TBA`.

A complete record:

```yaml
- title: ICSE
  year: 2027
  id: icse2027                                  # unique slug
  link: https://conf.researchr.org/home/icse-2027   # official site (ok if it changes yearly)
  deadline: '2026-06-30 23:59:59'              # full paper — always
  abstract_deadline: '2026-06-23 23:59:59'     # optional
  early_rejection: '2026-08-10 23:59:59'       # optional — only if decisive AND published
  rebuttal_start: '2026-09-23 00:00:00'        # optional pair (both or neither)
  rebuttal_end: '2026-09-25 23:59:59'
  notification: '2026-10-20 23:59:59'          # optional — the FIRST binding decision
  timezone: UTC-12
  place: Dublin, Ireland
  date: April 25 - May 1, 2027
  start: 2027-04-25
  end: 2027-05-01
  sub: "SE"                                     # category code (see §4)
```

---

## 8. Corner cases — slow down and think

1. **Page shows last year's dates.** If the "important dates" clearly belong to the previous edition
   (year mismatch, or dates already long past for a future event), the new CFP isn't up yet.
   **Do not copy stale dates.** Leave the record as-is and flag it for the user.
2. **A date was rescheduled / changed.** Always take the **latest** official date. If the page shows a
   struck-through old date beside a new one, use the new one. Trust the most recent official info and
   just update — no need to ask for routine reschedules.
3. **Some milestones announced, others not.** Record what's published and **omit** the fields that
   aren't out yet — never invent a missing one.
4. **Deadlines known, but the meeting place / dates aren't.** Still record the deadlines. For the
   meeting fields, use `TBA` for `place` / `date` and `TBA` (or omit) for `start` / `end` until they're
   announced — don't fabricate a city or meeting dates. If even the **paper deadline** is unconfirmed,
   don't add the entry yet.
5. **Tentative / approximate dates** ("around March 4", "early March", "tentative"): a tracker date must
   be a real, committed date. **Omit it** (or use `TBA`) rather than record an approximation.
6. **Revise-and-resubmit venues** (e.g. CHI, some PL rounds): map the author-response / revise window to
   `rebuttal_start` / `rebuttal_end`, and the **first** binding decision to `notification`.
7. **Don't add brand-new conferences silently.** Adding a venue is a commitment to keep it current.
   Confirm with the user that it belongs (right category, a venue worth tracking) before adding it.
8. **Past vs upcoming.** Collect a published decisive date whether it's already past or still upcoming —
   a closed conference can still have upcoming review milestones worth showing.

---

## 9. When unsure → ask

If you can't tell whether a date is decisive, whether the page is current, or which cycle a date belongs
to — **pause and ask**, with the official source link. Never guess into the data.
