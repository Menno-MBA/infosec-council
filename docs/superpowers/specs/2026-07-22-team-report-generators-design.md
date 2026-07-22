# Design: branded HTML report generators for the red / blue / incident team skills

**Date:** 2026-07-22
**Status:** proposed (awaiting approval)
**Author:** Menno Verheij (with Claude Code)

## Problem

The `infosec-council` skill has a mature, general, branded HTML dossier generator
(`report.js` + `report.sh`, JSON-in → Luméro-branded HTML). The three operational
team skills do not:

- `infosec-redteam` (Adversary Emulation Plan) — Markdown only, no generator.
- `infosec-blueteam` (Detection & Hardening Plan) — Markdown only, no generator.
- `infosec-incidentteam` (Incident Response Report) — has a `report.js`, but it is a
  **hardcoded one-off** (the UM-ransomware exercise baked into a `D = {…}` object,
  v1.8.1). Not parameterized, not wired into the SKILL deliverable.

So only the council emits a real, wired-in report. The council report itself is
**current** (it already renders the 5×5 risk matrix, the conditional-obligation ledger,
and deep-mode options) — this work is gap-filling for the three team skills, not a
council refresh.

## Goal

Give each team skill a branded HTML dossier generator at **exact parity** with the
council's: a zero-dependency Node `report.js` that reads a rich JSON object on stdin
(temp-file on Windows), base64-embeds the shared Luméro logos, reuses the council
stylesheet + visual vocabulary, and renders team-specific sections. Wire each into its
SKILL.md with a JSON field spec, and describe the mechanism in the README.

Non-goals: no `report.sh` bash variants for the team skills (the council calls `.js`
"preferred", `.sh` a jq fallback; the team generators are Node-only). No shared render
engine (each generator stays self-contained, matching the council/incident pattern).

## Architecture (all three, identical shape)

Follows the existing `infosec-incidentteam/report.js` pattern verbatim:

- **Input:** rich JSON object on stdin (`fs.readFileSync(0,'utf8')` → `JSON.parse`), OR
  `--in <file>` for a path, OR `--example` to render the bundled sample fixture (used by
  tests and the SKILL demo). On parse failure, `die()` with a clear message.
- **Assets:** logos resolved from `../infosec-council/assets` (as incident already does),
  base64-embedded via `mkLogo()`. Overridable with `LUMERO_LOGO_LIGHT` / `LUMERO_LOGO`.
- **Output:** `<slug>-report-<UTC-stamp>.html` in `<SKILL>_REPORT_DIR` (default cwd),
  prints `report written: <path>`. Slugs: `adversary-emulation`, `detection-hardening`,
  `incident`.
- **Brand shell:** the council `:root` palette + `.brandrule`/`.wrap`/`.head`/`.kicker`/
  `.meta`/`.exec`/risk-exposure bar/`.ledger`/`.advisor` cards/footer, inlined per file
  (zero-dep, self-contained — the council/incident convention). Helpers standardized:
  `htmlEscape`, `e`, `mkLogo`, `scoreOne` (the 5×5 from `frameworks.md`), `pill`/`badge`/
  `tag` builders, `table.t` builder, `ulOf`, `g` (safe accessor). One canonical helper set
  copied into each file so they don't drift (the inventory found incident had already
  drifted: `impLab` vs `impLabel`).
- **TLP marking:** a small TLP badge in the header meta bar and repeated in the footer
  fineprint (FIRST TLP 2.0 labels: CLEAR / GREEN / AMBER / AMBER+STRICT / RED). New,
  shared, tiny. Default per report below.

### Shared visual components (reused from the inventory)

`.tiles`/`.tile` (stat tiles: good/warn/bad/neutral) — **new, shared**, used by all three
exec summaries. Everything else already exists: risk-exposure bar (`scoreOne` + `.expo*`),
`table.t`, `.tag`/`.pill`/`.badge`/`.st` status pills, `.callout`/`.callout.warn`,
`.ledger`, `.advisor` cards, `.pctbar` progress bars, `.dial`/`.dstep` step cards.

## Report 1 — Adversary Emulation Plan (`infosec-redteam/report.js`)

Kicker: **Adversary Emulation Plan**. Default TLP: **AMBER+STRICT** (lists live weaknesses).
Grounding: CTID Adversary Emulation Library, ATT&CK Evaluations detection taxonomy,
Atomic Red Team, PTES/NIST 800-115, OWASP Risk Rating, TIBER-EU, TLP 2.0.

Sections (JSON top-level keys in `D`):

1. **Front-matter / header** — `title`, `subtitle`, `meta` (`ref`, `window`, `environment`,
   `version`, `authors`), `tlp`. Environment ∈ {isolated_range, production_segment,
   tabletop_paper}.
2. **Executive summary** — `exec` (narrative + `askOfManagement`), stat **tiles**
   (techniques attempted / detected / partial / missed, mean-time-to-detect), `verdict`
   pill, `systemic_issues[]`, `top_findings[]`.
3. **Scope & Rules of Engagement** — `scope`: `in_scope[]`/`out_of_scope[]` (two-col
   `table.t`), `window`, `environment`, `stop_conditions[]` (warn callout), `deconfliction`,
   `exclusions[]`, `authorization_ref`.
4. **Emulated adversary & rationale** — `adversary`: actor card (`name`, `motivation`,
   `sector_geo_fit`, `confidence` pill), `sources[]`, `runners_up[]`, `source_intrusion`,
   `objectives[]`, `flags[]`.
5. **ATT&CK kill chain** — `killchain[]` ordered `table.t`: step, tactic, technique_id +
   name, procedure_detail, target_asset, atomic_test_ref, expected_observable,
   range_only flag.
6. **Detection opportunities / blue-team scorecard** — `scorecard[]` `table.t`: per step,
   expected_log_source, control_expected, detection_category (none/telemetry/general/
   tactic/technique → red→green chip), fired, time_to_detect, analyst_note; plus
   `scorecard_summary` bar (% technique+tactic).
7. **Findings & remediation** — `findings[]` as finding cards: id, title, severity badge,
   exploitability×blast_radius (1–3 each) → criticality (3×3), chained_path, remediation,
   paired `detection_fix` (gap_type ∈ untested/no_logs/no_rule/detected), effort, status.
   Severity-count tiles at top.
8. **Safety attestation** — `safety`: roe_held, production_harm (must be false),
   deconfliction_events[], aborts[], evidence_handling, safety_lead_signoff. Attestation
   block with yes/no badges.
9. **The red team** — `seats[]` (threat-intel, operator, safety-lead) advisor cards;
   `verified[]` / `unverified[]` ledgers.

## Report 2 — Detection & Hardening Plan (`infosec-blueteam/report.js`)

Kicker: **Detection & Hardening Plan**. Default TLP: **AMBER+STRICT** (lists live gaps).
Grounding: ATT&CK v18 (parameterized `attack_version`), DeTT&CT log-source scoring, Sigma
+ Palantir ADS rule anatomy, D3FEND, CIS Controls v8 (IG1-first), ATT&CK Navigator layers,
TaHiTI/PEAK/Sqrrl hunts, MDR-not-SIEM reality. Join key across sections: `technique_id`.

Sections:

1. **Header** — `meta` (`ref`, `scope`, `attack_version`, `version`, `next_review`), `tlp`.
2. **Executive summary** — `executive_summary`: threat one-liner, coverage one-liner, stat
   **tiles** (in-scope / detected / hunted / gap), `top_gaps[]` with owner + confidence.
3. **Threat & TTP scope** — `ttp_scope[]`: technique_id + name, tactic, source, priority
   (pre-ransomware badge). Rendered as tags grouped by tactic.
4. **Log-source coverage map** — `log_sources[]` `table.t`: name, collected, centralization
   (central-siem / vendor-mdr / native-console / island / none), retention_days,
   reviewed_by, status pill (collected-and-alerting / collected-unwatched / not-collected),
   CIS-8 safeguard refs.
5. **Coverage heatmap** — `coverage_heatmap`: scoped technique cells in a CSS grid (tactic
   columns), colored by `state` (gap grey / logged-unwatched amber / hunted blue / detected
   green) with a legend. Right-sized to the scoped TTP list, not the full matrix.
6. **Detection rules** — `detections[]` `table.t`: name, status (Sigma), attack_technique,
   d3fend, cis_safeguard, log_source, logic_prose, level chip, `fires_natively` pill
   (native alert green / rule-not-built grey / SIEM-no-SIEM red), triage.
7. **Hunt hypotheses** — `hunts[]` as hunt cards (reuse `.advisor`): hunt_type badge,
   hypothesis, attack_techniques, data_sources, scope, analytic_logic, outcome pill
   (found / not-found / inconclusive), what_negative_proves, owner/next_action.
8. **Hardening backlog** — `backlog[]` ranked `table.t`: rank, control, attack_techniques,
   d3fend, cis+IG tag, attacker_step_closed, effort/impact pills, residual_gap, sme_note.
   Plus `sequencing` (now / later).
9. **Purple-team coverage scorecard** — `scorecard.steps[]` RAG grid: kill-chain step ×
   status (detected/hunted/hardened/gap), before/after, owner-when-gap; `summary` bar.
   Rendered only when scoring against a red-team plan (`purpleTeam` present).
10. **The blue team** — `seats[]` advisor cards; `verified[]` / `unverified[]`.

## Report 3 — Incident Response Report (`infosec-incidentteam/report.js`, converted)

Kicker: **Incident Response Report**. Default TLP: **AMBER**. Grounding: NIST 800-61r3 /
SANS PICERL / ISO 27035, RFC 3227 + NIST 800-86 chain-of-custody, GDPR Art. 33/34 (EDPB
9/2022 v2.0), NIS2/Cbw (in force 15 Aug 2026), DORA, CRA, TLP 2.0.

**Conversion:** rewrite to read JSON on stdin (like the council); move the baked UM example
to `infosec-shared/examples/um-ransomware-2019/incident-report.json`; `--example` renders it.

Keep the existing strong sections (severity banner, exec + priorities, risk 5×5,
timeline typed obs/act/dec, triage, containment dial + percent-isolated bars, assumptions
register, decision log, escalations, seats, verified/unverified). Fold in the high-value
research additions, each cheap and reusing existing CSS:

- **Notification tracker** (`notifications[]`) — replaces the binary obligations block with a
  **4-state lifecycle** (assessing / triggered / filed / ruled_out) reusing `.st` pills, and
  a **computed deadline countdown** per triggered row (`awareness_ts + duration` → remaining
  / overdue). Rows: GDPR Art.33/34, NIS2/Cbw 24h/72h/1mo, DORA, CRA, sector CSIRT, insurer.
  Ruled-out rows stay in the `.ledger`.
- **Breach register** (`breachRegister`) — always rendered (Art. 33(5)): entry no, controller,
  DPO contact, structured awareness block (timestamp / basis / pinned_by), data categories,
  approx numbers, risk assessment, decisions.
- **Evidence register** (`evidence.register[]`) — an actual itemized `table.t` (id, item,
  source host, tier, collected-by, time, hash-acq, hash-verify, storage, custody note),
  alongside the existing tier/custody prose.
- **Eradication gates** (`eradication.gates[]`) — a gated checklist (`.st` pills: open/met/
  n/a) instead of a prose paragraph: approach (rebuild/restore/hybrid), sequence,
  cleanroom note, reconnect order.
- **Comms log** (`commsLog[]`) — chronological `table.t` (ts, channel, audience, statement,
  cleared_by) + a hardened **do-not-claim** warn callout (forbidden-until-forensics list).
- **TLP badge**, `severity.history[]` (re-rating trail), `lessons.actionItems[]`
  (item/owner/due/status).

## Distribution / CI

`cli.js` already copies the whole team-skill directories verbatim (`copyDir`), so new
`report.js` files ship automatically for the npx install. The logos resolve from the sibling
`infosec-council/assets` for global/project installs (skills sit side-by-side under
`skills/`). Verify `build-desktop` / `build-plugin` include assets for those editions; if a
team report ships in an edition without the council assets alongside, fall back to the
wordmark (already handled by `mkLogo`). A CI smoke test renders each generator with
`--example` and asserts a non-empty HTML file.

## SKILL + README wiring

- Each team SKILL.md gains an **HTML report** subsection after its Markdown deliverable:
  the JSON field spec + `node "<skill_dir>/report.js"` invocation + the Windows temp-file
  note, mirroring the council's "HTML report" block.
- README: update the "one report" framing so all four skills are shown to emit branded
  dossiers; add a short "Reporting" description of the mechanism (JSON-in → branded HTML,
  shared brand shell, TLP-marked, 5×5 risk reused from `frameworks.md`).

## Testing

For each generator: a sample JSON fixture under `infosec-shared/examples/`, rendered via
`--example`, asserted to produce a valid non-empty HTML file with the expected section
headings. The incident converts its existing baked demo into the fixture (byte-comparable
sections where practical).

## Right-sizing (applies throughout)

EU-SME calibration from the research: CIS IG1 as the floor (flag IG2/IG3 as stretch);
MDR/native-console, not a staffed SOC; scope heatmaps to the TTP list, not the full matrix;
name functions not individuals; mostly-ruled-out obligation ledgers are the correct,
auditable default; every "gap" / "inconclusive" / "assessing" row carries an owner or it is
flagged incomplete.
