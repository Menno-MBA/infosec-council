# Configuration

Three files hold everything tunable, and all three are injected into every seat at
deliberation time. Where `frameworks.md` says *what is in scope*, `context.md` says *what this
organization has decided*, and `external-websources.md` says *where to verify*.

An upgrade never overwrites a file you have tuned.

| File | Holds | Path |
|---|---|---|
| `frameworks.md` | Regulatory config: in-scope regimes, control baseline, standard versions, obligation registry, the 5x5 risk scale | `.claude/skills/infosec-council/` |
| `context.md` | Strategic config: house positions, risk-appetite boundaries, prior decisions | same |
| `external-websources.md` | Source register and retrieval policy: where a fact gets verified | same |

---

## `frameworks.md`, one place to maintain

All regulations, standards, guidelines and technologies live here, not scattered across the
personas. Personas reference subjects **by name** and inherit the detail, so a single edit
propagates to all seats with no per-persona changes.

- **Part A, configuration knobs** you flip once: the **control baseline** (currently
  `CIS Controls IG1`; change to IG2/IG3 to re-level the whole council), jurisdiction, backup
  standard, MFA standard, default risk posture, quantification depth.
- **In-scope regimes** toggle: GDPR, ePrivacy, NIS2/Cbw, CER/Wwke, DORA, EU AI Act, CRA,
  PCI DSS, SOC 2. Flip a regime to "in scope" and the relevant seats treat it as live.
- **Part B, the reference register**: every subject with its canonical version or level, and a
  cross-reference column showing which personas cite it.
- **Part C, the obligation registry**: conditional obligations with a trigger, a determination
  owner, execution owner(s), a clock, a recipient and a statutory ref.

Each row carries a **"last verified" date**, and moving rows are flagged `[VERIFY]`. Moving
that date without re-checking is worse than leaving it stale.

The **5x5 risk matrix** lives here too: impact negligible to severe, likelihood rare to almost
certain, each 1 to 5, scored out of 25 and banded Low / Moderate / High / Critical. All four
skills rate risk on it. The report shows both inherent and residual exposure as two markers on
one bar, and an already-observed impact is scored Almost certain, never Possible.

### The obligation registry and the determination layer

Some duties are not opinions to be argued; they either apply or they do not.

Before Round 1 the council runs a **determination pass**: the determination owner for each row
(Compliance or the DPO) returns it as **TRIGGERED**, meaning a required action with an owner, a
clock and a recipient, or as **NOT TRIGGERED**, with a one-line reason. Determination is split from
**execution**, so a cross-cutting duty like outbound incident reporting is never collapsed into
one seat and silently dropped.

Two things make it structural rather than hopeful:

- The forced NOT-TRIGGERED line turns **absence into a decision on the record**. For a general
  SME most rows return NOT TRIGGERED, and that is the correct, auditable default.
- **Gate B** blocks the synthesis from closing while any TRIGGERED obligation lacks a matching
  action with an owner and a clock. Consensus does not override a missing statutory action.

The dossier renders both as a **Regulatory obligations** section: a required-actions table plus
an explicit-negative ledger of what was considered and ruled out. That doubles as ISO 27001
Annex A / NIS2 governance evidence.

Registering a new obligation is one row in Part C. No code change.

**Registered by default:**

| Obligation | Trigger | Owner (determine → execute) | Clock |
|---|---|---|---|
| GDPR breach to the DPA (Art. 33) | personal-data breach with risk to individuals | DPO → DPO | 72h |
| GDPR notice to individuals (Art. 34) | high risk to individuals | DPO → DPO + CISO | without undue delay |
| NIS2 early warning / notification / final report (Art. 23) | NIS2/Cbw in scope and a significant incident | Compliance → CISO + Legal & Comms | 24h / 72h / 1 month |
| CER initial notification / detailed report (Art. 15) | formally **designated** a critical entity under CER/Wwke | Compliance → CISO + Legal & Comms | 24h / 1 month |
| NIS2 IoC sharing (Art. 29) | a CERT/CSIRT affiliation exists | Compliance → Security Operations | voluntary |

Three more ship as candidate rows (DPIA Art. 35, Art. 28 processor terms, control-baseline
shift), each addable as one line.

> **CER/Wwke is designation-gated.** Its rows fire only for an organisation a ministry has
> formally designated as a critical entity. That is roughly 500 in the Netherlands, and no SME
> by size alone. A sector match is not scope. Note its clock is *not* NIS2's: 24h then a detailed
> report at one month, with no 72h stage in between.

---

## `context.md`, strategic house positions

Alongside the regulatory config, `context.md` holds the organization's **strategic** config and
is injected into every member too:

- Standing **architecture preferences**, for example "Art. 9 / trade-secret data stays on an own EU
  endpoint, not vendor-orchestrated".
- Categorical **risk-appetite boundaries**: what is out of appetite regardless of ROI.
- **Prior strategic decisions**, preferred vendors and patterns.

It ships as a fill-in template. Fill in Parts A to C with your house positions; the council
reads it automatically and writes only to the Part D auto-context block, where it appends
durable organization facts it learns over time.

**One deliberate guardrail: house positions are defaults, not doctrine.** The orchestrator
injects an explicit licence for any seat to challenge a house position, and to say so when it
overrides one, so the file informs the council without quietly turning an adversarial panel
into a confirmation machine.

**Per-organization separation.** Set `COUNCIL_ORG` to keep one client's context and journal out
of another's. That matters for consultancies.

---

## `external-websources.md`, where to verify

The register of authoritative external sources: what each one is, and what it is explicitly
**not** good for. This is what turns "verify volatile facts" from an instruction into something
that actually happens.

Every source row carries a **"not authoritative for"** cell, because a register that only says
what to trust reproduces the failure it exists to prevent. It is the negative column that
records, for instance, that ATT&CK tactic IDs move between versions.

Part A holds the retrieval policy: per-mode query budgets, an operator `Retrieval: off` switch,
a staleness interval, and the rules injected verbatim into every seat. Part D holds maintenance
and a jurisdiction-localisation checklist.

---

## Grounding: the output is only as good as what you feed it

The council reasons over what it is grounded in, so verdict quality tracks input quality. Four
layers matter, in order of impact:

1. **The question.** Concrete situation, constraints, and the decision you actually face. A
   vague prompt yields a generic answer; "we run Microsoft 365 Business Premium, 40 staff, no
   in-house IT, considering Copilot" lets the seats reason about *your* reality.
2. **Strategic context** (`context.md`). Without it the council assumes a generic EU SME.
3. **Framework detail** (`frameworks.md`). The fuller and more accurate this catalog, the more
   precise the compliance and control reasoning.
4. **Where to verify** (`external-websources.md`). Without it the seats reason from training
   data and quietly assert stale versions, deadlines and tactic names.

Treat the result as a point-in-time read, calibrated to the context you supplied. Re-run it
when the question, the facts or the rules change.

---

## Customizing further

- **Add a member or a team seat.** Drop `.claude/agents/<role>.md`, add it to the relevant
  `SKILL.md`, and for the plugin, list it in `plugin.json`. Identity & Access is an open
  candidate.
- **Re-tune biases.** The council's value depends on members genuinely disagreeing. If two
  members always agree, sharpen their conflicting mandates.
- **Swap regulatory anchors** to your jurisdiction or sector (HIPAA, DORA, FedRAMP).
- **Localize the sources.** `external-websources.md` tags its Dutch rows `[jurisdiction]`; Part
  D carries the checklist: supervisory authority, NIS2 supervisor, national CSIRT and its
  portals, CERT feed, sanctions list, the matching Part C sets, and the Jurisdiction knob in
  `frameworks.md`.
- **Turn retrieval off** for a confidential engagement: set `Retrieval: off` in Part A. The run
  then degrades visibly rather than silently answering from memory.
