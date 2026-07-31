# How the council works

One model runs as several sub-agents with deliberately conflicting mandates. The
disagreement is the product. Everything below exists to fight one failure mode: a panel that
agrees by conformity instead of by reasoning.

---

## What makes this one different

Plenty of "LLM council" projects exist. Four things here are not shared with them, in order
of how much they matter:

**1. The calibration journal with outcomes.** Every run is logged with each seat's stance, a
confidence level, and a numeric probability. You record later how the decision actually turned
out, and `council meta` scores the panel with a Brier score and an Expected Calibration Error
plus a reliability curve — not just a hit-rate. Outcomes include `not-tested`, for the common
case where nobody executed the recommendation, so a delivery gap is never mistaken for a wrong
call. The council reports its ungraded runs before every deliberation, because a confidence
number nobody checks is decoration. Over time you learn whether its "high confidence" is worth
anything, and exactly where it is over- or under-confident — the one thing a one-shot answer
can never tell you. See [Reports and the decision journal](reports-and-journal.md).

**2. The EU-SME regulatory register, and a retrieval pass that uses it.** `frameworks.md`
carries the in-scope regimes, the control baseline and the canonical standard versions, each
with a "last verified" date. Its companion `external-websources.md` says *where* to verify
them, and every skill runs a retrieval pass against it before deliberating. A fact counts as
verified only if the run actually retrieved it. See [Configuration](configuration.md).

**3. The build/break/run triad.** The Security Architect (build it securely), Offensive
Security (break it) and Security Operations (see and survive it failing) are deliberate
counterweights. Where they disagree on feasible-versus-detectable is itself a finding.

**4. The attack and detection pre-mortems.** The red-team and operations seats reason
backwards from a breach that has already happened, which surfaces failure paths a
forward-looking design review misses.

The rest of the mechanism — independent first-round analysis, anonymized cross-examination,
forced debate, the minority report — is shared with the wider LLM-council family.

> **Design note.** The council architecture, the depth modes, the anonymized peer review, the
> forced debate when consensus looks too clean, the chairman synthesis with a minority report,
> and the decision journal are adapted from
> [`TorpedoD/claude-council`](https://github.com/TorpedoD/claude-council), an open-source
> multi-agent decision framework. This edition fixes a panel of security *domain experts*
> rather than general thinking lenses. The attack and detection pre-mortems are its own
> additions.

---

## Depth modes

Append a depth flag to your question, or let the council pick. Default is Standard.

| Mode | When | Members | Retrieval | Peer review | Debate | Closing check |
|---|---|---|---|---|---|---|
| **`-quick`** | Low-stakes, reversible in a day | 3 most relevant (keeps >= 1 adversarial seat) | None, and it says so | No | No | Chairman self-check |
| **`-standard`** | Default | All 7 | Bounded pass | Yes | Only if consensus is suspiciously clean | Dispatched fidelity check |
| **`-deep`** | High-stakes, costly to reverse | All 7 + decision-science pass | Bounded pass + landscape sweep | Yes | Always | Full synthesis audit |
| **`-boardroom`** | High-stakes, and you want live cross-talk | All 7 as agent-teams teammates | Bounded pass + landscape sweep | Yes (live) | Always | Full synthesis audit |

**Boardroom mode** runs the panel as live
[agent-teams](https://code.claude.com/docs/en/agent-teams) teammates who cross-examine each
other directly instead of through the chairman. It needs the experimental flag
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`; without it, `-boardroom` falls back to Deep.
Independence still comes first — each seat commits its own position before reading the others —
and the round cap still holds, because live peer exchange is exactly where
agreement-by-conformity compounds.

---

## The required output block

Every member ends with the same block, so the verdict is calibrated rather than asserted:

```
STANCE       go | conditional-go | no-go | defer | reframe
CONDITION    what this stance actually requires (conditional stances only)
CONFIDENCE   low | medium | high
PROBABILITY  0-100, that THIS SEAT'S OWN position survives a 12-month look-back
ASSUMPTIONS  the load-bearing assumptions
WHAT WOULD CHANGE MY MIND
UNKNOWNS
```

The **stance** makes the convergence and debate triggers mechanical rather than a judgment
call. The **condition** is what a conditional stance actually requires, so a shared label
cannot pass as agreement. The **probability** is a number rather than a word, which is what
the decision journal can score over time.

---

## How the room converges

After the anonymized cross-examination, each seat scores the others on how well their position
would survive scrutiny (1 to 5). Convergence then takes three things, not one:

1. At least **six of seven on the same stance**.
2. Their **stated conditions materially agreeing** — every pair, not just a majority cluster.
3. A **probability spread of no more than 20 points** among those aligned seats.

A shared label alone is not enough. `conditional-go` absorbs any condition, so seven seats can
return the same word while asking for seven different things. When the label agrees and the
substance does not, the run is marked **`label-only`** and goes to the forced debate instead of
stopping — and that outcome is recorded, so the failure mode is countable across runs rather
than a judgement nobody can see afterwards.

Routing is first-match-wins, in this order:

| | Condition | Outcome |
|---|---|---|
| 1 | Deep or Boardroom | Always debate, then record whichever outcome the three tests gave |
| 2 | Label test fails | `split` — carried into synthesis as a real trade-off |
| 3 | Label holds, condition or spread fails | `label-only` — debate the divergence the label hid |
| 4 | All three hold, but agreement came without friction | `forced-debate` |
| 5 | All three hold and it survived challenge | `after-challenge` — stop early |

In a forced debate the dissenter must write a concrete pre-mortem: *"it is 12 months later and
this failed, here is the story."* Generic contrarianism does not count.

Deliberation is capped at Round 1, the cross-examination, and at most one forced debate (one
further exchange in Deep and Boardroom). More rounds trade tokens for conformity, not accuracy.
The dissenting seat always reaches the minority report, whatever the outcome.

---

## Grounding

Before the panel deliberates, the council runs a **retrieval pass** against
`external-websources.md`, a maintained register of authoritative sources, and injects what it
found into every seat.

Any seat that leans on a regulation's status, a deadline, a standard version or a vendor fact
that could have moved must verify it or mark it `UNVERIFIED`. The chairman lists any unverified
load-bearing fact next to the confidence, so you can see what the verdict is standing on. A
fact counts as verified only if the run actually retrieved it — so a Quick run, which retrieves
nothing, says so rather than passing memory off as grounding.

Where retrieval is switched off or web access is unavailable, the run degrades **visibly**
instead of quietly falling back to training data.

Retrieval carries a trust boundary in both directions: retrieved content is data and never
instruction, queries carry no client names or indicators, and a URL taken from case material is
never fetched.

---

## The sixteen seats

Seven deliberate; nine do operational work. The team seats are grounded in the ENISA European
Cybersecurity Skills Framework (ECSF) role profiles.

| Seat | Skill | Mandate | Anchors to |
|---|---|---|---|
| CISO | Council | Posture vs. business enablement, budget, incident readiness | ISO 27001 (ISMS), NIST CSF, CIS Controls (IG1) |
| Security Architect | Council | Secure-by-design & default; hardens bought SaaS, identity-first (build) | STRIDE, secure-by-design, CIS Benchmarks, zero trust |
| Offensive Security (Red Team) | Council | Attacker's view, attack pre-mortem, exploitation chains (break) | MITRE ATT&CK |
| Security Operations | Council | Detection, response & recovery (run/survive) | NIST CSF, NIST IR guidance, MITRE ATT&CK, tested backups |
| Compliance Analyst | Council | Mandatory EU law vs chosen attestations; evidence + crosswalks | GDPR, NIS2, EU AI Act, DORA/CRA/PCI DSS where applicable, ISO 27001, SOC 2 |
| DPO / Privacy | Council | Lawful, fair, transparent processing; advises & monitors | GDPR (lawful basis, ROPA, DPIA, transfers), ePrivacy, EU AI Act |
| Risk Manager | Council | Frames risk two-sidedly; third-party risk | ISO 31000/27005, CIS RAM, NIST small-business guidance, cyber insurance |
| Threat Intelligence | Red team | Selects a realistic adversary, maps its TTPs, sets objectives and flags | ECSF CTI Specialist; MITRE ATT&CK |
| Penetration Tester | Red team | Executes the kill chain as atomic tests, scores each detection opportunity | ECSF Penetration Tester; Atomic Red Team / Caldera |
| Safety Lead | Red team | Authorization, Rules of Engagement, scope, deconfliction; hard veto | ECSF Auditor + Legal; signed RoE, isolated range |
| Detection Engineer | Blue team | Log-source coverage map and detection rules from attacker TTPs | ECSF Incident Responder (SOC/SIEM); ATT&CK, D3FEND, sigma |
| Threat Hunter | Blue team | Assume-breach hunt hypotheses for what detection cannot cover | ECSF CTI Specialist; hypothesis-driven hunting |
| Hardening Architect | Blue team | Control-gap analysis and the prioritized hardening backlog | ECSF Architect + Implementer; CIS Controls, D3FEND |
| Incident Commander | Incident team | Triage, containment as a dial, eradicate and recover, decision log | ECSF Cyber Incident Responder; NIST IR, CSIRT coordination |
| Forensics Lead | Incident team | Evidence and chain of custody, timeline, the exfiltration read | ECSF Digital Forensics Investigator |
| Legal & Comms | Incident team | Notification clocks, breach register, external-comms gate | ECSF Legal/Compliance + DPO; GDPR Art 33/34, NIS2/Cbw |

The three security seats form a deliberate triad — Architect (*build* it securely), Offensive
Security (*break* it), Security Operations (*see and survive* it failing). That tension keeps
the room from drifting into "just add another control nobody tests or monitors."

---

## Model safety controls and the Cyber Verification Program

Claude's most capable models run real-time cyber safeguards that automatically detect and block
requests that look like prohibited or high-risk cybersecurity use. The decision council rarely
trips these; the operational skills — above all the red team's adversary-emulation output — are
the dual-use part most likely to be interrupted.

- **Prohibited use stays blocked, by design.** Mass data exfiltration, live-production
  ransomware and the like have no legitimate defensive use and cannot be unblocked. The team
  skills are built to stay well clear of that line.
- **Legitimate dual-use work can be verified.** Adversary emulation, vulnerability testing and
  detection engineering may be blocked or interrupted by default. Anthropic runs a free,
  application-based **Cyber Verification Program (CVP)** that lifts these dual-use restrictions
  for verified practitioners. Some account types and platforms are excluded — check current
  eligibility. Apply with your Organization ID through Anthropic's Cyber Use Case Form;
  decisions typically arrive within two business days. See [Anthropic's cyber safeguards
  guide](https://support.claude.com/en/articles/14604842-real-time-cyber-safeguards-on-claude).

**Luméro participates in the CVP** and runs these engagements under proper authorization, so if
you would rather not manage verification and Rules of Engagement yourself,
[we can run them for you](https://lumero.nl).
