# Changelog

## v1.7.1 (2026-07-20)

This release adds a conditional-obligation layer, so a statutory or registered duty is surfaced
structurally rather than only when a persona happens to raise it. It slots into the existing loop;
outbound incident reporting is the first registered instance, not a special case.

### Obligation registry + determination pass
- `frameworks.md` gains **Part C, an obligation registry**: a config-driven table of conditional
  obligations (id, trigger, determination owner, execution owner(s), clock, recipient, ref), seeded
  with the outbound-reporting rows (GDPR Art. 33 and 34, NIS2/Cbw 24h / 72h / 1-month, NIS2 Art. 29
  IoC sharing) plus three candidate rows (DPIA, Art. 28 processor gate, control-baseline shift).
- Before Round 1 the council runs a **determination pass**: each obligation's determination owner
  (Compliance or the DPO) returns it as TRIGGERED (with an owner and a clock) or NOT TRIGGERED (with a
  one-line reason). The forced NOT-TRIGGERED line turns a missing obligation into a decision on the
  record. Determination (a compliance judgement) is split from execution (operational, often a
  different seat or an out-of-council role such as Legal & Comms), so a cross-cutting duty like
  outbound reporting is never collapsed into one seat and then dropped.

### Chairman Gate B + explicit-negative ledger
- A second closing gate: for every TRIGGERED obligation the synthesis MUST contain a matching action
  with a named owner and a clock, or it reopens. Consensus does not override a missing statutory or
  registered action. The Deep-mode synthesis audit now also checks for Gate B misses.
- The dossier gains a **Regulatory obligations** section under the risk rating: a required-actions
  table plus a "considered and ruled out" ledger. That ledger is a defensible "what we assessed and
  why we did or did not act" trail, usable as ISO 27001 Annex A / NIS2 governance evidence. It renders
  identically in report.js and report.sh (byte-parity tested) and in report.py, via a new optional
  `obligations` field that is omitted safely when no obligations are in play.

### Editions
- The mechanism is mirrored across all three editions (Claude Code, Desktop, ChatGPT); the ChatGPT
  knowledge folder is regenerated from the canonical sources and stays in sync.

## v1.7.0 (2026-07-20)

This release upgrades the risk model, polishes the report, and extends the council into a
four-skill security suite.

### Risk matrix: 3x3 to 5x5
- The qualitative risk scale is now a standard 5x5 heat map. Impact is negligible / minor /
  moderate / major / severe (1 to 5) and likelihood is rare / unlikely / possible / likely /
  almost certain (1 to 5), giving an exposure score out of 25 banded Low (1 to 4), Moderate
  (5 to 9), High (10 to 15), Critical (16 to 25). This removes the old 3x3 dead zone (only
  {4,6,9,10,15,25} were reachable, so "about 20 out of 25" could not be expressed).
- Observed-impact anchoring: an adverse impact that is already observed or confirmed is scored
  Almost certain, not Possible. The report now renders inherent and residual exposure as two
  markers on the bar, so the gap is the visible value of the recommendation. The Deep-mode
  synthesis audit now checks that the likelihood does not contradict an observed fact.
- The three report generators (report.js, report.sh, report.py) still accept the legacy 3-level
  words so older journal entries render. Byte parity between report.js and report.sh is kept and
  tested.

### Report polish
- New optional `subtitle` field: a long framing renders as a smaller line under the title, so
  the H1 stays a crisp one-line decision instead of a run-on.

### Team skills (red, blue, incident)
- Three operational skills join the council, each producing a working artifact instead of a
  verdict, with seats grounded in the ENISA ECSF role profiles:
  - `infosec-redteam`: Threat Intelligence Specialist, Penetration Tester, and a safety lead
    (Auditor + Legal) produce an Adversary Emulation Plan. Authorized, RoE-gated, isolated-range
    only.
  - `infosec-blueteam`: SOC Incident Responder, Threat Hunter, and Architect + Implementer
    produce a Detection & Hardening Plan (log-source map, detections, hunts, hardening backlog).
  - `infosec-incidentteam`: Incident Responder, Digital Forensics Investigator, and Legal &
    Compliance (DPO) produce an Incident Response Report (timeline, containment, evidence
    register, notification clocks, decision log).
- The council SKILL now routes: operational exercises go to the matching team skill instead of
  being turned into a decision dossier, and the team skills escalate genuine judgment calls back
  to the council. The four skills share one `frameworks.md`.
- Packaging: `plugin.json` lists the nine new team personas (skills auto-glob), the npx installer
  installs the team skills alongside the council, and the Claude.ai/Desktop council edition stays
  council-only (its build no longer ingests the team personas).

## v1.6.0 (2026-07-11)

This release implements the July 2026 mechanism review of the council. That review
stress-tested the deliberation design against the 2023 to 2026 research on multi-agent
LLM deliberation, fact-checked the regulatory register against primary sources, and
scanned the ecosystem and the Claude Code platform.

Full notice of the review outcome, kept on the record: the core mechanism was found
sound and, for the infosec-council niche, ahead of the field. Independent first-round
analysis, anonymized cross-examination, the forced debate when consensus is too clean,
the minority report, and the outcome-tracking journal are each supported by the strongest
findings in the literature, and no credible open-source infosec-specific council competitor
exists. The worthwhile improvements were mostly around the mechanism, not in it: content
freshness plus a grounding rule, a stronger confidence and calibration story, safer
packaging and updates, and adoption of newer platform primitives. The full report is kept
in the project as `council-mechanism-review-2026-07-11.md`. Everything below is that review,
executed.

### Deliberation mechanism
- The required output block now carries a STANCE (go / conditional-go / no-go / defer /
  reframe) and a numeric PROBABILITY, alongside the low/med/high confidence. Stance makes the
  convergence and forced-debate triggers mechanical instead of a judgment call; probability is
  the number the journal scores.
- Convergence detection with early stopping: genuine convergence after challenge stops the
  room; a too-clean consensus is pushed through a forced debate; a persistent split is reported
  as a real trade-off. Deliberation is capped at two exchanges (three in Deep and Boardroom),
  because more rounds trade tokens for conformity, not accuracy.
- The forced debate now requires a concrete pre-mortem artifact from the dissenter ("it is 12
  months later and this failed, here is the story"), not generic contrarianism.
- Anonymized cross-examination feeds mediated summaries instead of raw transcripts, to reduce
  anchoring, and adds a scored anonymous ranking: each seat rates the others on how well their
  position would survive scrutiny (1 to 5).
- Deep mode adds a synthesis audit: a fresh sub-agent checks the chairman's draft for dropped
  dissent, claims no seat made, and confidence higher than the seats' own spread supports.
- Boardroom mode: an opt-in variant that runs the seats as live agent-teams teammates who
  cross-examine each other directly (needs `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`; falls back
  to Deep when unavailable).
- A grounding / volatile-fact rule was added to the CLI and Desktop editions (the ChatGPT
  edition already had one): moving regulatory, version, and vendor facts must be verified or
  marked UNVERIFIED, and the chairman surfaces unverified load-bearing facts next to the confidence.
- A context-sufficiency gate and a journal lookback before Round 1, so thin questions are caught
  and comparable past outcomes inform the new verdict.
- An optional cross-vendor seat: run one seat (usually Offensive Security) on a different model
  to break the correlated bias of seven same-model personas.

### Calibration journal
- New zero-dependency `journal.js` (Node), so the journal works on Windows and inside the
  Desktop/Cowork sandbox, not only where `jq` is present.
- `meta` now reports a Brier score by confidence level, using each run's numeric probability,
  which is a real calibration measure rather than a bucket count.
- Run shas are salted, so reruns of the same question no longer collide; a stable `family` id
  links reruns of the same decision.
- `COUNCIL_ORG` gives per-organization journals and house-context, so one client's data stays
  out of another's runs.
- New `lookback` command, and an automatic pre-Round-1 lookback.

### Regulatory register (frameworks.md), verified 2026-07-11
- NIS2 / Cyberbeveiligingswet: in force 15 Aug 2026 (passed the Eerste Kamer 7 Jul 2026);
  zorgplicht, meldplicht, and NCSC registration go live then.
- EU AI Act: high-risk (Annex III) obligations postponed to 2 Dec 2027 by the Digital Omnibus;
  Art. 50 transparency still applies from 2 Aug 2026.
- ISO/IEC 27701: 2025 edition, now a standalone, independently certifiable PIMS.
- CRA Art. 14 reporting flagged as imminent (11 Sep 2026); ISO 27001 Amd 1:2024 and the 2013
  sunset noted; Cyber Essentials v3.3 "Danzell"; NIST small-business guidance now the CSF 2.0
  Small Business Quick Start (SP 1300).
- Added a horizon-scan block (GDPR Omnibus IV RoPA relief, EU-US DPF appeal, ISO 31000 revision)
  marked as proposed and not law, plus per-row "last verified" dating.

### Reports
- Fixed a colouring bug in all three generators: a "Not recommended" verdict rendered green,
  because the positive pattern was tested before the negative one. Negatives are tested first now.
- Reports render the probability, the panel outcome (converged / split / forced-debate), any
  unverified facts, the peer-ranking grid, and each seat's stance and probability.
- report.js and report.sh are covered by a golden-file parity test (`scripts/test-reports.js`).

### Packaging and safety
- The repo is now a Claude Code plugin and a one-line marketplace
  (`/plugin marketplace add Menno-MBA/infosec-council`), which also gives desktop users the real
  seven sub-agents in Cowork. `cli.js build-plugin` produces a standalone plugin artifact.
- Installer data-loss fix: `--force` upgrades no longer destroy your tuned `context.md` or
  `frameworks.md`; a customized `frameworks.md` is backed up to `frameworks.md.prev`, and
  `--reset-config` is the explicit opt-in to overwrite.
- The desktop skill zip now ships `report.js` and `journal.js`, not only the `jq` versions.
- The ChatGPT knowledge folder is generated from the canonical sources by
  `scripts/sync-chatgpt.js` and checked in CI, so the three editions cannot silently drift.
- Version bumped to 1.6.0 (package.json now matches the release tag).
