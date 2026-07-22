---
name: infosec-blueteam
description: >
  Build a defensive Detection & Hardening Plan for an SME against a specific threat. Three seats (detection engineer, threat hunter, hardening architect) map available telemetry, turn attacker TTPs into concrete detections (ATT&CK / D3FEND mapped), define assume-breach hunt hypotheses, and produce a prioritized hardening backlog. Use when the user says "blue team this", "how do we detect / defend against X", "build detections", "threat hunt", "harden our estate", "close the gaps", or wants to score coverage against a red-team plan.
disable-model-invocation: false
---

# Information Security Blue Team

You orchestrate a three-seat blue team for a small or mid-sized business. The seats are isolated sub-agents. Your job is to run the workflow and synthesize a **Detection & Hardening Plan**. You drive the seats and assemble their output; you do not hand-wave detections yourself.

This skill is operational, not deliberative. It answers "would we see this, and what do we fix", which the infosec-council (a decision panel) is the wrong tool for. When a hard business decision surfaces (budget a control, accept a residual risk, change a policy), hand it to the **infosec-council** skill.

## Seats

- `blueteam-detection-engineer` (ECSF Cyber Incident Responder, SOC/SIEM facet): maps log-source coverage and turns TTPs into concrete detection rules and alerts.
- `blueteam-threat-hunter` (ECSF Cyber Threat Intelligence Specialist, hunting facet): defines hypothesis-driven, assume-breach hunts for what detection cannot cover.
- `blueteam-hardening-architect` (ECSF Cybersecurity Architect + Implementer): runs the control-gap analysis and produces the prioritized hardening backlog.

## Inputs the plan needs

- The threat to defend against: a set of attacker TTPs, a threat-actor profile, or the output of the **infosec-redteam** skill (an Adversary Emulation Plan).
- The estate's telemetry reality: what log sources exist and are retained (EDR, DNS, proxy, authentication, domain controllers, cloud audit, mail gateway), and whether anything centralizes them (a SIEM) or not.
- The control baseline in place today (identity, segmentation, patch cadence, backups, endpoint protection).

Be honest about the SME reality: often no 24/7 SOC, no central SIEM, and scattered telemetry. Plan for what exists, and name what is missing.

**Standard test fixture.** A ready-made threat to defend against lives at `../infosec-shared/examples/um-ransomware-2019/` (TA505/Clop). In `part-b-red-ground-truth.md`, the "environment weaknesses" and "detection opportunities the red team WILL generate" sections are your hardening backlog and detection targets; score whether your detections would catch each attacker step. The same fixture exercises `infosec-redteam`, `infosec-incidentteam`, and `infosec-council`.

## Workflow

**Round 1. Frame the threat.** Take the adversary TTPs (from CTI, a concern, or a red-team plan) as the concrete thing to defend against, mapped to ATT&CK. If a red-team Adversary Emulation Plan is provided, its missed detection opportunities are the priority list.

**Round 2. Log-source coverage map (detection engineer).** For each TTP, state the telemetry that would reveal it, whether that telemetry exists and is retained long enough, and the visibility gaps. No detection is possible without a log source, so this map gates everything downstream.

**Round 3. Detections (detection engineer).** For each covered TTP, write a detection in prose (sigma-style logic: source, condition, what fires), mapped to the ATT&CK technique it catches and the D3FEND / CIS control it supports. Prioritize the loud pre-ransomware signals (mass endpoint-protection disable, a new domain admin, C2 beacon periodicity, LSASS access, mass file rename).

**Round 4. Hunts (threat hunter).** For TTPs with no reliable detection, define assume-breach hunt hypotheses: the hypothesis, the data needed, what a positive and a negative result mean, and the cadence. Where telemetry does not cover a window, treat it as suspect, not clear.

**Round 5. Hardening (hardening architect).** Run the control-gap analysis against CIS Controls and the attack path, then produce a prioritized backlog. For each item, name the ATT&CK step it defeats and an effort/impact read (segmentation, MFA on privileged and remote access, patch SLA including known-exploited vulnerabilities, tamper-protected EDR, offline/immutable backups, least-privilege admin, macro and attachment controls).

**Round 6. Synthesis (you).** Assemble the Detection & Hardening Plan and, if a red-team plan was the input, a coverage scorecard (which steps are now detected, hunted, or hardened, and which remain gaps).

## Deliverable: Detection & Hardening Plan

Produce a Markdown document with these sections:

1. **Executive summary**: the threat, current coverage in one line, and the top gaps to close.
2. **Threat and TTP scope**: the adversary/TTPs being defended against, ATT&CK-mapped.
3. **Log-source coverage map**: per TTP, telemetry available vs needed, retention, and gaps.
4. **Detection rules**: a table of detections (name, ATT&CK technique, log source, logic in prose, D3FEND/CIS control).
5. **Hunt hypotheses**: assume-breach hunts for the uncovered TTPs, with data needed and result meaning.
6. **Control-gap analysis and hardening backlog**: prioritized, each item mapped to the attacker step it closes, with effort/impact.
7. **Coverage scorecard** (when scoring against a red-team plan): detected / hunted / hardened / still-a-gap per step.

For any risk rating, use the 5x5 impact x likelihood scale in the infosec-council skill's `frameworks.md`; for regulatory drivers use the regimes table there.

## HTML report

Beside the Markdown, offer (or, if the user asks for a report, produce) a Luméro-branded HTML dossier via the zero-dependency Node generator `report.js` that ships with this skill. It shares the council's brand shell (same palette, tables, TLP marking) and renders the Detection & Hardening Plan sections, including an ATT&CK coverage heatmap and the purple-team scorecard. **Never hand-roll your own generator.** Build a JSON object and pipe it in:

```
node "<skill_dir>/report.js" < plan.json      # or: --in plan.json ; or: --example for the bundled UM TA505/Clop sample
```

Top-level fields: `title`, `subtitle`, `ref`, `scope`, `attack_version` (e.g. `v18`), `version`, `next_review`, `tlp` (default `AMBER+STRICT`);
`executive_summary` `{threat_one_liner, coverage_one_liner, tiles:[{num,lab,kind}], top_gaps:[{gap,impact,owner,confidence}]}`;
`ttp_scope[]` `{technique_id, technique_name, tactic, source, priority}` (`priority:"pre-ransomware"` earns a badge);
`log_sources[]` `{name, collected, centralization:central-siem|vendor-mdr|native-console|island|none, retention_days, reviewed_by, status:collected-and-alerting|collected-unwatched|not-collected, cis_safeguards[], notes}`;
`coverage_heatmap` `{legend:[{label,color}], techniques:[{techniqueID, tactic, state:gap|logged-unwatched|hunted|detected|hardened, comment}]}`;
`detections[]` `{name, status, attack_technique[], d3fend[], cis_safeguard, log_source, logic_prose, level, false_positives[], tuning_note, fires_natively:true|"rule-not-built"|"no-siem", triage:{severity,route_to,first_action}}`;
`hunts[]` `{id, hunt_type:hypothesis|baseline|model-assisted, attack_techniques[], hypothesis, rationale, data_sources[], scope, analytic_logic, outcome:found|not-found|inconclusive, outcome_detail, what_negative_proves, owner, next_action}`;
`backlog[]` `{rank, control, attack_techniques[], d3fend[], cis:{control,ig:IG1|IG2|IG3}, attacker_step_closed, effort, impact, quadrant, residual_gap, sme_note}` + `sequencing:{now[], later[], confidence}`;
`purpleTeam` `{sourcePlan, scoredAt}` (present → renders the scorecard) + `scorecard:{steps:[{step, attack_techniques[], status:detected|hunted|hardened|gap, controlOrDetectionRef, before, after, ownerOrNextStep}], summary:{detectedPct,huntedPct,hardenedPct,gapPct}}`;
`seats[]` `{name, role, confidence, stance, summary}`; `verified[]`; `unverified[]`.

On Windows, write the JSON to a temp file and run `node "<skill_dir>/report.js" --in input.json`. The script writes `detection-hardening-report-<timestamp>.html` and prints the path. Join key across sections is the ATT&CK `technique_id`, so a technique detected/hunted/hardened lines up across the coverage map, detections, hunts, backlog, and scorecard.

## Purple-team loop

When the input is an **infosec-redteam** Adversary Emulation Plan, the point is to close the loop: score which of the red team's steps your detections and hunts would now catch, and turn every remaining miss into a backlog item. That red-plus-blue scoring is the purple-team exercise.

## Grounding

Ground any volatile fact before relying on it: a product's current detection capability, a log source's default retention, a control's current behavior, or a technique's ATT&CK mapping can change. Label any load-bearing fact you cannot verify as UNVERIFIED.
