---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: ce-plan-bootstrap
type: feat
title: "feat: council v3, decision-quality probability, delivery seat, question types, cross-acceptance"
created: 2026-10-14
depth: deep
target_version: 3.0.0
---

# feat: Council v3: measure the right thing, seat the right people

**Product Contract preservation:** no upstream requirements document. Bootstrapped from the
2026-10-13 balance analysis (journal statistics over 10 runs plus a live probe of 8 persona
agents) and two scope confirmations taken in session on 2026-10-13: "Widen it" (Round-2
redesign and register refresh in scope) and "Confirm as revised" (v3.0.0, single-context
editions swap peer scoring for a steelman). The planning session crashed before this file
was written; it was reconstructed from the session transcript on 2026-10-14.

---

## Goal Capsule

The deliberation machinery from v2.2.0 is sound. What is off is what its numbers measure and
who sits at the table.

1. **PROBABILITY measures "no incident", not "right call".** 8 of 8 probed seats defined their
   number as "judged right AND no breach afterwards". The seat that expects breaches
   (offensive-security) therefore scores lowest (mean 54 vs 66 to 75), and the 20-point spread
   gate measures pessimism rather than disagreement. The persona files never got the v2.2.0
   wording and omit CONDITION.
2. **Nobody owns delivery.** Runs keep concluding "the gap is execution". Duties are routed to a
   DPO the company does not have.
3. **Seats hold every tool.** No persona has a `tools:` line; probes used 1 to 17 tool calls and
   two noticed an earlier dossier in the repo. Round-1 independence rests on politeness.
4. **The panel leans regulatory; SME losses come from fraud.** Four personas carry
   notification-clock text the determination pass already owns; 5 of 10 runs were fraud and no
   seat owns finance process controls. NIS2 defaults to Yes for firms that are mostly out of scope.
5. **The stance labels do not fit the questions.** 1 of 10 questions was a single either/or; 51
   of 63 seat positions were `conditional-go`, with compound conditions that make the pairwise
   test unpassable or meaningless.

Ships as **v3.0.0**: the meaning of PROBABILITY and the shape of the seat block both change.

---

## Decisions (user-confirmed scope)

| # | Decision |
|---|---|
| D1 | PROBABILITY = decision quality: the chance that, with 12 months of hindsight, a reviewer would still choose the stated course over the alternatives, whether or not an incident happens anyway. Seats and chairman. |
| D2 | Confidence word is a fixed band of the number: low < 55, medium 55 to 74, high >= 75. Seats write only PROBABILITY; the orchestrator derives the word. `log` derives a missing word and rejects a contradicting one. |
| D3 | Records are stamped `probability_basis: "decision-quality"` and `protocol: "3.0.0"` by `log`. Legacy records stay untouched; `meta` reports them in a separate block. Every new record carries `alternatives` (non-empty). |
| D4 | Grading asks "knowing what you know now, would you still choose this course over the listed alternatives?" Legacy records keep the old question, labelled. |
| D5 | CONDITION is one atomic condition, <= 25 words. Enforced at the seat (re-ask), measured by the eval scorer; never rejected at log time (the field is verbatim). |
| D6 | Persona files stop restating the block. Seven council personas get `tools: WebSearch, WebFetch` and `omitClaudeMd: true`. The orchestrator injects a defined seat packet. Dispatch by `subagent_type`, unnamed, never as a fork; fallback is the labelled single-context protocol, never unrestricted sub-agents. Boardroom: Round 1 unnamed, teammates from Round 2. A malformed or missing block is re-asked once, then recorded `missing` and never counted as agreeing. |
| D7 | CISO becomes the delivery seat. Risk Manager leads business-process and fraud controls plus financial impact (still never owns or accepts risk). Clock text leaves CISO and Security Operations. NIS2 becomes a per-run entity test. Quick always seats offensive-security. |
| D8 | Role map in `context.md`; SKILL.md carries the default duty list, so an absent or blank map makes every owner `unassigned (<duty>)`. Synthesis carries an action plan of <= 5 owned, dated items; Gate B statutory actions stay in the obligations ledger outside the cap. |
| D9 | Question types: decision (STANCE), option choice (CHOICE), action plan (FIRST + NOT NOW), bundle (one primary with the full protocol plus <= 2 secondaries answered one line per seat, recorded in the same record, not calibrated). Pre-flight classifies; `-type=<decision|choice|plan|bundle>` declares. |
| D10 | Round-2 cross-acceptance: each seat marks accept/reject on every other seat's Round-1 CONDITION (or FIRST). Convergence test 2 (and for plans, test 1) reads the matrix. A condition changed in Round 2 loses its acceptances. A pure function in `journal.js` computes the three tests; `log` rejects a `converged` value the matrix contradicts. |
| D11 | Desktop and ChatGPT replace anonymized peer scoring with a steelman step; cross-acceptance stays, labelled a self-check; ChatGPT per-type blocks move to a generated knowledge file. |
| D12 | Eval: deterministic scorer `scripts/eval-council.js` over maintainer-generated runs; seat micro-evals (5 reps) plus one council run per case per arm (baseline v2.2.0, then v3). Five cases. Separate COUNCIL_HOME, scratch dir outside git, arm personas installed user-level and checked with `verify`. |
| D13 | Maintainer-only grading worksheet beside each fixture's ground truth; the agent never records an outcome. |
| D14 | Register refresh of the rows whose dates passed (Cbw, Wwke, AI Act Art. 50, CRA Art. 14, ATT&CK, horizon scan). README/docs examples default to Standard. `verify` warns when a project or user persona copy without the v3 tools line shadows the plugin's. |

Carried forward: rebalance within seven seats (chosen over an eighth seat, so 6-of-7 holds).
Not in scope: splitting SKILL.md; Dutch output; tool limits for the nine team seats.

---

## Defaults chosen where the design was silent

The flow analysis was lost in the crash, so these were settled during reconstruction.

- **Headless runs.** The classifier's question type stands without confirmation, and the bundle
  split is applied automatically; both are stated in one line at the top of the synthesis.
- **Team-skill escalations** pass `-type=decision` (a hard call is a decision by construction)
  unless the escalation names options, then `-type=choice`.
- **Missing seat in the matrix.** A `missing` seat neither accepts nor is accepted; it counts in
  the panel denominator, so a run with one missing seat needs every remaining seat aligned.
- **Seats present below seven** (Quick). Convergence is not computed (no Round 2), as today.
- **Choice type.** CHOICE carries an optional CONDITION; test 1 compares CHOICE values; test 2
  applies to aligned seats that named a condition.
- **Plan type.** Test 1: some seat's FIRST is backed (author plus acceptors) by >= n-1 seats.
  Test 2: every pair inside that aligned set accepts each other's FIRST. Test 3 unchanged.
- **Node absent.** The orchestrator applies the same three tests by hand from the matrix and says
  so; `journal.sh` logs without validation (as today) and says so in its help.
- **Legacy `meta`.** `brier_overall` / `ece_overall` cover decision-quality records only; legacy
  records report under `legacy_basis` with a note that they mix "right call" with "no incident".

---

## Implementation Units

### U1. Journal: basis, bands, alternatives, convergence function
- `journal.js`: `confidenceBand(p)`; `log` stamps basis/protocol, derives/validates confidence
  for chairman and members, requires `alternatives`, validates `question_type`, `secondaries`
  (<= 2), `action_plan` (<= 5, each with action/owner/due), and recomputes convergence when an
  `acceptance` matrix is present, rejecting a contradicting `converged`.
- `convergence({members, acceptance, question_type})` exported; `journal.js converge` reads JSON
  on stdin and prints the three tests and the implied outcome.
- `meta`: split by basis; `grade`: new question plus alternatives, legacy label; `worksheet`
  hook lives in the maintainer script (U8), not here.
- `journal.sh`: stamp basis/protocol; help states it does not validate.
- Tests in `scripts/test-journal.js`.

### U2. Orchestrator (SKILL.md)
Seat packet; dispatch rules; question-type pre-flight and `-type=` flag; per-type output blocks
between `<!-- OUTPUT-BLOCKS:BEGIN -->` markers; decision-quality definition; band rule; CONDITION
cap and re-ask; `missing`; cross-acceptance in Round 2 and the matrix-driven convergence;
Boardroom R1 unnamed; Quick seats offensive-security; role map routing and default duty list;
action plan; secondaries; logging schema; never record an outcome.

### U3. Personas
Seven council personas: frontmatter `tools`, `omitClaudeMd`; output contract points at the
injected block; CISO delivery mandate, no clocks; OPS no clocks; Risk Manager process/fraud and
financial impact; Compliance NIS2 entity test wording; descriptions updated.

### U4. Configuration
`context.md` role map (Part D, auto-context becomes Part E); `frameworks.md` NIS2 entity test
and register refresh (U9 facts); `external-websources.md` verified dates.

### U5. Reports
`report.js`, `report.sh`, `report.py`: action plan section, question type, member CHOICE /
FIRST / NOT NOW, secondaries, and a probability pill worded by basis. Byte parity kept; tests.

### U6. Single-context editions
`desktop/SKILL.md` and `chatgpt/INSTRUCTIONS.md`: steelman, self-check cross-acceptance, types,
decision-quality wording; `sync-chatgpt.js` generates `chatgpt/knowledge/output-blocks.md`
from the SKILL.md markers; budget kept.

### U7. Guards
`check-desktop-parity.js`: new shared needles; persona checks (no legacy wording, tools line,
pointer to injected block). `bin/cli.js verify`: shadowing persona warning.

### U8. Eval and grading
`eval/` (README, cases incl. three new ones with ground truth), `scripts/eval-council.js`
(deterministic scorer, arm comparison, invalid-run detection), `scripts/grading-worksheet.js`,
tests in `scripts/test-eval.js`, wired into `npm test`.

### U9. Register refresh, docs, release
Row-by-row refresh from primary sources; README/docs to Standard examples and v3 semantics;
CHANGELOG; version 3.0.0 in the three manifests; integrity manifest.

---

## Verification

- `npm test` green (versions, parity incl. personas, integrity, ChatGPT sync + budget, reports,
  journal, eval).
- Re-run the persona probe after release: a seat asked what its PROBABILITY means should
  describe a hindsight judgement on the choice, not the absence of an incident.
- Maintainer runs the eval arms per `eval/README.md`; baseline from tag `v2.2.0`.

## Risks

- `tools` misspelt fails open (Claude Code ignores unknown keys): guarded by the parity check.
- Web tools need approval by default and can stall background seats: documented in
  getting-started (pre-approve `WebSearch` / `WebFetch`).
- ChatGPT budget: per-type blocks move to a knowledge file rather than cutting rules.
