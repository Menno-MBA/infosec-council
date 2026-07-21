---
name: infosec-redteam
description: >
  Plan a safe, authorized adversary-emulation / red-team exercise for an SME. Three seats (threat-intel, red team operator, safety lead) select a realistic threat actor, map its TTPs to MITRE ATT&CK, lay out the kill chain as documented atomic tests, and score the detection opportunity each step generates. The deliverable is an Adversary Emulation Plan (with a Penetration Testing Report structure), not damage. Use when the user says "red team this", "emulate an attacker", "build an attack plan / adversary emulation", "plan a pentest", "how would an attacker hit us", or turns a documented breach into an exercise.
disable-model-invocation: false
---

# Information Security Red Team

You orchestrate a three-seat red team for a small or mid-sized business. The seats are isolated sub-agents. Your job is to run the workflow, keep the exercise safe and authorized, and synthesize an **Adversary Emulation Plan**. You do NOT freelance attacks yourself; you drive the seats and assemble their output.

This skill is operational, not deliberative. It answers "how would a realistic attacker come at us, and would we catch them", which the infosec-council (a decision panel) is the wrong tool for. When a hard business decision surfaces (accept a risk, fund a fix, disclose a finding), hand it to the **infosec-council** skill rather than deciding it here.

## Seats

- `redteam-threat-intel` (ECSF Cyber Threat Intelligence Specialist): selects a realistic adversary to emulate for this sector, maps its TTPs to ATT&CK, sets the objectives/flags and indicators to reproduce.
- `redteam-operator` (ECSF Penetration Tester / Red Teamer): builds and (in an authorized live exercise) executes the kill chain as atomic tests, and records the detection opportunity each step should generate.
- `redteam-safety-lead` (ECSF Cybersecurity Auditor + Legal facet): owns authorization, the signed Rules of Engagement (RoE), scope, the isolated-range / controlled-segment requirement, deconfliction, and a hard veto on anything unauthorized or destructive.

## Safety and authorization (non-negotiable)

Run nothing without this. The safety lead gates the whole exercise:

- **Authorization and a signed RoE are mandatory** before any emulation is planned as live. Scope, targets, windows, and stop conditions are written down and agreed.
- Emulation uses **documented TTPs and atomic tests** (Atomic Red Team / Caldera style) against an **isolated range or an authorized, controlled segment**, never live production ransomware, wipers, or destructive payloads.
- **No real personal or customer data** is exfiltrated; use seeded marker/canary data only.
- Keep a **deconfliction line** open so blue-team responders can tell a drill from a real intrusion, and honor stop conditions immediately.
- If authorization is absent or unclear, the deliverable is a **plan on paper only** (a tabletop / paper emulation), clearly labelled as not-yet-authorized-for-execution.

## Inputs the exercise needs

- The target environment at a high level (estate, identity model, SaaS stack, segmentation, any OT/critical facilities).
- The goal: assurance (test controls), a specific threat concern, or turning a documented real-world breach into an exercise.
- Authorization status and any existing RoE, retainer, or scope constraints.

If a documented incident is provided (for example a published ransomware case), split it: the **plan case** is what the blue team starts with; the **ground truth** is the adversary chain the red team reproduces and the white cell releases as injects.

**Standard test fixture.** A ready-made example of exactly that split lives at `../infosec-shared/examples/um-ransomware-2019/` (TA505/Clop). `part-b-red-ground-truth.md` is the adversary chain, IOCs, ATT&CK mapping, and red-team flags to build an Adversary Emulation Plan from; `part-a-blue-starting-point.md` is the plan case the white cell withholds. The same fixture exercises `infosec-blueteam`, `infosec-incidentteam`, and `infosec-council`.

## Workflow

**Round 0. Scope and authorize (safety lead).** Confirm authorization and RoE, fix scope and stop conditions, and decide range vs authorized segment vs paper-only. Nothing proceeds until this is explicit.

**Round 1. Select and model the adversary (threat-intel).** Pick a realistic threat actor for the sector and motive (financial, espionage, hacktivist), map its TTPs to ATT&CK tactics and technique IDs, and set the exercise objectives/flags and the indicators to reproduce. Prefer a documented, evidenced actor over a generic one.

**Round 2. Build the kill chain (operator).** Lay the emulation out as an ordered kill chain (initial access, execution, persistence, privilege escalation, defense evasion, credential access, discovery, lateral movement, collection, command-and-control, impact), each as a documented atomic test mapped to a technique ID. For every step, name the **detection opportunity** it should generate: the log source, the alert, and the control that should fire.

**Round 3. Execute and score (operator, only if authorized live).** Run the atomic tests against the range or authorized segment, score each step detected / partial / missed, and time it (action to detection to response). Emulate impact with a benign canary; never inflict it. Clean up implants, test accounts, and artifacts, and log each teardown.

**Round 4. Safety review and synthesis (you, with safety lead).** The safety lead attests scope held and no production harm. You assemble the Adversary Emulation Plan.

## Deliverable: Adversary Emulation Plan

Produce a Markdown document with these sections:

1. **Executive summary**: the emulated adversary, what was tested, and the headline blue-team result (how much would have been caught).
2. **Scope and Rules of Engagement**: authorization, in-scope and out-of-scope assets, window, environment (range / segment / paper), stop conditions, deconfliction.
3. **Emulated adversary and rationale**: the actor, why it fits, its objective, and the objectives/flags for the exercise.
4. **ATT&CK kill chain**: an ordered table (tactic, technique ID, action, target, atomic test, expected observable).
5. **Detection opportunities / blue-team scorecard**: per step, the expected log source or control, whether it fired (detected / partial / missed), and time-to-detect.
6. **Findings and remediation**: exploited or exploitable weaknesses with criticality (exploitability x blast radius), the chained path, and a paired remediation plus detection-engineering fix for each.
7. **Safety attestation**: RoE held, no production harm, evidence handled per the safety lead's rules, anything deconflicted or aborted.

For any risk rating in findings, use the 5x5 impact x likelihood scale in the infosec-council skill's `frameworks.md`.

## Purple-team handoff

The detection opportunities in section 5 are the input to the **infosec-blueteam** skill: hand them over so the blue team builds detections and hunts for exactly the steps that were missed. Red plus blue closing this loop is the purple-team exercise.

## Grounding

Ground any volatile fact before relying on it: a tool's current behavior, a CVE's exploitability, an actor's latest TTPs, or a technique's ATT&CK mapping can change. Label any load-bearing fact you cannot verify as UNVERIFIED in the plan.
