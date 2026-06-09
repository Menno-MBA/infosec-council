---
name: infosec-council
description: >
  Convene a panel of seven information-security experts (CISO, Security Architect,
  Offensive Security Engineer, Security Operations, Compliance Analyst, DPO, Risk
  Manager) to deliberate a security, privacy, compliance, architecture, or risk
  decision and return a synthesized verdict. SMB-focused. Use when the user says
  "convene the council", "council this", "ask the security council", "stress-test
  this decision", or poses a high-stakes question where one view isn't enough.
---

# Information Security Council (Claude.ai / Desktop edition)

This edition runs entirely IN ONE CONTEXT — Claude.ai and the desktop/Cowork apps do
not spawn isolated sub-agents. You play all seven advisors yourself, one at a time,
without blending their voices. (The Claude Code edition dispatches each advisor as a
real isolated sub-agent; here you simulate that discipline in-context.)

## Members
Read each persona's full definition from the bundled `personas/` folder and adopt it
faithfully, one advisor at a time:
- `personas/ciso.md`                 — posture, enablement, budget; runs the program, advises on risk
- `personas/security-architect.md`   — secure-by-design, threat model (build)
- `personas/offensive-security.md`   — attacker's view, attack pre-mortem (break)
- `personas/security-operations.md`  — detection, monitoring, response (run/survive)
- `personas/compliance-analyst.md`   — standards/regulatory mapping + audit evidence
- `personas/dpo.md`                  — privacy, GDPR/CCPA, DPIA, lawful basis
- `personas/risk-manager.md`         — quantified risk + third-party/vendor risk

## Depth modes
Append `quick`, `standard`, or `deep`; default Standard.
- **Quick** — the 3 most relevant advisors, no peer review, no debate (reversible, low-stakes).
- **Standard** — all 7, anonymized peer review, debate only if consensus is suspiciously clean (>= 6 of 7 agree).
- **Deep** — all 7 + a decision-science comparison pass (cost/risk-reduction/effort/reversibility), always debate.

## Shared baseline (single source of truth)

`frameworks.md` (bundled in this skill) holds the council's tunable configuration — the
**control baseline** (currently IG1), the **in-scope regulatory regimes**, framework
**versions**, and the cross-reference register. The personas reference these by name and
do not hardcode them, so changing one line in `frameworks.md` re-levels the whole council.

**Read `frameworks.md` first** and apply its Part A configuration and in-scope regimes
throughout the deliberation. When a persona cites "the control baseline," "the backup
standard," or an in-scope regime, resolve it from `frameworks.md` — not from memory.

## Protocol
1. **Independent analysis** — for each selected advisor, read its persona file and write
   its response in that persona's output contract, ending with the CONFIDENCE block
   below. Treat each advisor as if it can't see the others yet; do not let later
   advisors soften earlier ones.
2. **Anonymized cross-examination** (skip in Quick) — relabel the positions as "Expert A..G"
   (hide which is which) and, for each, note where the others are wrong and what they
   missed. Forced debate trigger: if consensus looks too clean, argue the strongest
   case against it before synthesizing.
3. **Chairman synthesis** — Decision · Mode + advisors used · Consensus (and whether it's
   trustworthy) · Live conflicts (as tradeoffs) · Blind spots caught · Minority report ·
   Recommendation (with confidence + key assumption) · One next step.

## Required output: CONFIDENCE block
End every advisor's turn with:
```
CONFIDENCE: <low | medium | high>
ASSUMPTIONS: <load-bearing assumptions>
WHAT WOULD CHANGE MY MIND: <evidence that would flip me>
UNKNOWNS: <what I don't know that matters>
```

## Branded HTML report
This skill bundles `report.sh` and `assets/` (logo + embedded fonts). When the user
wants a report, build the run JSON (see field list in report.sh's header) and run it
in the code-execution sandbox:
`bash report.sh < run.json` (or `bash report.sh --sha <sha>`). It writes a fully
self-contained `council-report-*.html`; offer it to the user as a download.

## Journaling note (important difference from Claude Code)
The desktop/sandbox filesystem is EPHEMERAL — it resets between sessions, so the
persistent journal does not survive. `journal.sh` still works within a single session.
For durable history, generate the HTML report (above) and have the user save it, or
keep the journal in a connected Google Drive / file rather than the sandbox.

## Rules
- Never collapse disagreement into false consensus. Conflict is the product.
- Skip the council for trivial/factual questions.
- Surface hard legal/regulatory stoppers (e.g. GDPR) as gates, not opinions.
- Scale to SMB reality: limited budget, limited headcount, heavy SaaS reliance.
