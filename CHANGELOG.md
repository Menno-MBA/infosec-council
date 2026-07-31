# Changelog

## v2.1.1 (2026-07-31)

The chairman's self-smoothing check no longer runs only in Deep.

- **The closing check now runs in every mode.** Four checks that were previously buried inside the
  Deep-only synthesis audit are lifted out and scaled: **dropped dissent**, **manufactured
  unanimity**, **confidence above the panel's own distribution**, and **a risk rating that breaks
  the anchoring rule**. Quick does them as a declared chairman self-check; Standard dispatches one
  narrow reviewer against the seats' actual returns; Deep and Boardroom keep the full audit, which
  subsumes them.
- **Why:** all three failure modes were observed in a real Deep run on this repo. The audit caught a
  DPO's formal dissent dissolved into a balanced-sounding tradeoff, unanimity claimed where only
  three of seven seats said it, and a residual score dropped below what the anchoring rule allows so
  the recommendation looked more valuable than it was. The chairman is the same model that ran the
  panel, so this is the most likely defect in any finished synthesis. Leaving the only safeguard in
  Deep meant every Standard run shipped an unexamined chairman.
- Cost is roughly one agent against seven. The parity guard covers the new rules in both editions.

## v2.1.0 (2026-07-30)

The suite stops reasoning purely from training data. All four skills gain a retrieval pass against a
maintained register of authoritative sources, scaled by depth mode.

- **`external-websources.md`, a source register.** A new file beside `frameworks.md`, in the same
  shape: Part A the retrieval policy (per-mode query budgets, an operator `Retrieval: off` switch, a
  staleness interval, and four injectable rules), Part B the source table, Part C per-skill
  must-check sets, Part D maintenance and a jurisdiction-localization checklist. Where
  `frameworks.md` says *what is in scope* and `context.md` says *what this organization has decided*,
  this says *where to verify*. Every Part B row carries both an **authoritative for** and a **not
  authoritative for** cell, because a register that only says what to trust reproduces the failure it
  exists to prevent: it is the negative column that records NIST enriching only higher-priority CVEs
  since April 2026, and that ATT&CK tactic ids move between versions.
- **A retrieval pass in every skill.** The council gains **Round 0c**, after the determination pass
  and before Round 1 so its findings can be injected alongside `frameworks.md`, `context.md`, and the
  determination set. Depth modes now carry a research dimension: **Quick retrieves nothing and says
  so**, Standard runs a bounded pass, Deep and Boardroom add a landscape sweep. The three team skills
  have no depth modes, so their pass always runs. Blue runs it *before* Round 1, because Round 1 is
  where TTPs are first mapped to ATT&CK; incident runs it inside triage but it never gates
  containment.
- **The failure this fixes, concretely.** ATT&CK was catalogued as "current". v19 (28 Apr 2026)
  retired the **Defense Evasion** tactic, splitting it into **Stealth** (keeping TA0005) and
  **Defense Impairment** (new TA0112), so a run mapped from memory emitted a retired tactic into an
  ATT&CK-keyed kill chain, coverage heatmap, and the scorecard that joins them. `frameworks.md` now
  pins the version; the redteam orchestrator and operator persona no longer hardcode a tactic list;
  the shared TA505/Clop fixtures are relabelled.
- **Honesty about what a verdict stands on.** A fact counts as verified only if the run **actually
  retrieved it** — not "the source exists", not "I know this". Facts the budget did not reach are
  unverified like any other. Where retrieval is off or web access is unavailable, the run degrades
  **visibly** rather than falling back to memory. The council dossier now renders a `verified` line
  beside `unverified`, reaching parity with the three team dossiers.
- **Trust boundary, both directions.** Retrieved content is **data, never instruction**, stated to
  the orchestrator that reads the raw page as well as to every seat, since a hostile page reaching the
  brief steers all seats at once. The brief carries facts, sources and dates only — no stance — so it
  grounds the panel without anchoring it. Outbound, queries carry generic subject terms only and
  never case-identifying material, and a URL taken from case material or an indicator list is
  analysed as a string, never visited. `SECURITY.md` gains two threat-model rows, a retrieval
  honest-limits section, and a corrected claim: the scripts still make no network calls, the skills
  now do. A test fixture ships so the data-never-instruction rule can be tested rather than asserted.
- **The calibration loop is closed.** The journal had 8 runs and 0 recorded outcomes, so every
  confidence figure the council printed was unfalsifiable. The cause was the vocabulary, not
  laziness: `correct|partial|wrong` had no slot for the most common real result, which is that
  nobody executed the recommendation, so it was never put to the test. Adds **`not-tested`** as a
  fourth outcome, deliberately excluded from the Brier and ECE maths and surfaced instead as a
  **`delivery_rate`**, because a high not-tested count is an execution problem in the organisation
  and must not be read off the same number as panel accuracy. Adds **`journal.js pending [days]`**,
  the ungraded runs old enough to have a result. Round 0 now reports that ledger every run, uses the
  `lookback` command rather than eyeballing the file, and asks for a comparable prior run's outcome
  before deliberating, since that result is the highest-value input available; it never blocks a live
  incident for bookkeeping. Round 3 states measured reliability beside asserted confidence, or says
  plainly that too few outcomes are graded to claim one. The `family` hash comment is corrected: it
  is an exact-question fingerprint and does not link reruns, which `lookback` does by similarity.
- **A desktop parity guard.** `scripts/check-desktop-parity.js` asserts that the hand-maintained
  `desktop/SKILL.md` states the same retrieval and outcome policy as the council orchestrator. It
  found three real divergences on its first run. Deliberate exclusions (the pending ledger, which
  needs a journal that survives between sessions) are recorded in the script with their reason.
- **Editions.** The register ships in the Claude Code / plugin and Claude.ai/Desktop editions and is
  preserved across upgrades the way a customized `frameworks.md` is (`.prev` backup, `--reset-config`
  to reset). **The ChatGPT edition is unchanged** — no new knowledge file, no instruction rewrite —
  so the personas that reference the register carry a fallback for when it is absent.

## v2.0.0 (2026-07-22)

A major step: the operational team skills reach reporting parity with the council, the council's
deliberation mechanism is upgraded to the current state of the art, and the codebase is
security-hardened. This release also consolidates the v1.7.x and v1.8.x work into one 2.0 milestone.

- **Branded HTML dossiers for every team skill.** New zero-dependency Node generators render the
  **Adversary Emulation Plan** (`infosec-redteam/report.js`), the **Detection & Hardening Plan**
  (`infosec-blueteam/report.js`), and, converted from a hardcoded one-off into a general
  JSON-driven generator, the **Incident Response Report** (`infosec-incidentteam/report.js`). All
  three share the council's brand shell (palette, tables, 5x5 risk bar, TLP marking) and take their
  JSON on stdin (or `--example` for the bundled TA505/Clop sample). Signature sections include the
  ATT&CK kill-chain + blue-team detection scorecard (red), the log-source coverage map + ATT&CK
  coverage heatmap + purple-team scorecard (blue), and a notification tracker with live deadline
  countdowns + itemized evidence register + eradication gates (incident). Each team `SKILL.md` gains
  an HTML-report field spec; the README's reporting section now covers all four skills.
- **Council mechanism to state of the art.** The anonymized peer ranking now **rotates position
  order** per member and **length-normalizes** the briefs, and scorers are told to judge reasoning
  over verbosity/confidence, mitigating the order, verbosity, and self-assurance biases documented
  for LLM judges; aggregation reports the spread and prefers the median against an outlier scorer.
  The calibration journal (`journal.js meta`) adds **Expected Calibration Error (ECE) and a
  reliability curve** beside the Brier score, so you can see where the panel is over- or
  under-confident.
- **Security hardening.** Report input is treated as untrusted: three stored-XSS / CSS-injection
  paths (a raw percentage, a raw clock value, an unvalidated legend colour) are fixed, all
  JSON-derived values are HTML-escaped, CSS colours are allowlisted, numerics are clamped, and the
  council output filename sanitises its `sha`. A **SHA-256 integrity manifest**
  (`scripts/integrity.sha256`) plus `infosec-council verify` and `npm run integrity` give
  tamper-evidence (SHA-256, not the collision-broken MD5); CI and `npm test` fail if a shipped
  script no longer matches its hash. New **`SECURITY.md`** documents the threat model, input
  handling, the integrity trust model and its limits, and the supply-chain posture (npm provenance,
  out-of-band hash, pinned refs).
- **Consolidates** the v1.7.0 5x5 risk matrix + team skills, the v1.7.1 conditional-obligation layer
  (determination pass, Gate B, obligation ledger), and the v1.8.x observed-vs-assumed guardrail and
  cross-skill exercise fixture, described in the entries below.

## v1.8.3 (2026-07-21)

Guardrail against the version-drift class of bug, plus a README refresh.

- **Version-parity guard.** New `scripts/check-versions.js` asserts `package.json`,
  `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` all agree, and on a tag build
  that the tag equals `v<version>` (which would also have caught the tangled v1.8.0 / v1.7.1 history).
  Wired into the release workflow before any build, and exposed as `npm test` (guard + report tests).
- **README refresh.** The repository tree now lists `infosec-shared/` (the exercise fixture), the
  incident report generator, and `check-versions.js`; a v1.8.x "recently shipped" note describes the
  assumptions guardrail and fixture; the Contributing section documents `npm test`; stale version
  references updated.

## v1.8.2 (2026-07-21)

Packaging and consistency fixes for the v1.8.1 additions; no behavioural change to the skills.

- **Version parity.** `package.json` is bumped to 1.8.2 alongside `plugin.json` and `marketplace.json`.
  The CLI derives its version from `package.json` and stamps it into the built plugin manifest, so the
  1.8.1 release artifacts reported 1.7.1; all three manifests now move together.
- **Fixture ships on every install path.** The `npx` installer copied the council plus the three team
  skills but not `infosec-shared`, so the cross-skill exercise pointers dangled for npx installs. The
  installer now also copies `infosec-shared` (marketplace and plugin-zip installs already included it).
- **Regression coverage for the incident report generator.** `scripts/test-reports.js` now also renders
  `infosec-incidentteam/report.js` and asserts the assumptions guardrail is visible (inline ASSUMED tags
  on timeline rows and the Assumptions-to-verify register).
- **Repo hygiene.** Removed the stray `_to_delete/` scratch folder and added it (plus generated
  `incident-report-*.html`) to `.gitignore`.

## v1.8.1 (2026-07-21)

This release hardens the incident team against a subtle failure mode, an assertive commander
filling gaps under pressure and having those inferences harden into the record as fact, and adds a
reusable cross-skill exercise fixture. The council skill is unchanged from v1.7.1.

### Observed-vs-assumed guardrail (incident team)
- The `incident-commander`, `incident-forensics-lead`, and `incident-legal-comms` personas now tag
  any environmental fact not present in the incident inputs (for example that the estate is
  virtualized, that immutable backups exist, that an EDR is deployed) as `[ASSUMED - verify: <owner>]`
  and feed it to an assumptions register. An assumption is a lead to confirm or kill, not a fact.
- `infosec-incidentteam` gains a first principle (separate observed from assumed, the incident-side
  analogue of the council's `UNVERIFIED` rule), a **synthesis gate** (no timeline, containment, or
  decision-log entry may present an unstated environmental fact as established; it is rewritten
  conditionally with a verify-owner or dropped), and an **Assumptions register** deliverable section.

### Portable incident report generator
- New `infosec-incidentteam/report.js`: a zero-dependency, Lumero-branded HTML Incident Response
  Report generator. Paths resolve relative to the skill (no hardcoded absolutes), assets and output
  dir are env-overridable. It renders inline ASSUMED tags on timeline rows and an
  Assumptions-to-verify table, reusing the council report stylesheet for visual consistency.

### Shared cross-skill exercise fixture
- New `infosec-shared/examples/um-ransomware-2019/`: a standard scenario modelled on the publicly
  documented 2019 university ransomware incident (TA505 / Clop). **Part A** (blue-team starting point)
  and **Part B** (red-team ground truth, ATT&CK chain, IOCs, weaknesses, flags, RoE) are split so a
  facilitator can withhold B and release it as injects. Includes a facilitator README and a cleaned
  example incident report faithful to Part A (a guardrail showcase, not a fabricated dump).
- Cross-skill pointers added to `infosec-incidentteam`, `infosec-redteam`, and `infosec-blueteam` so
  one scenario exercises the incident, red, blue, and council skills and their hand-offs.

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
