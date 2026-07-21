# Exercise fixture: UM-style ransomware (TA505 / Clop, 2019)

A standard, reusable scenario for testing the infosec skills. It is modelled on
the publicly documented 2019 Maastricht University ransomware incident: a phished
foothold, a long quiet dwell time on a flat Active Directory domain, escalation
to full domain admin, endpoint AV switched off, then enterprise-wide Clop
encryption that also took out the mail servers and the online backups, timed for
the run-up to a holiday.

## Files

| File | Audience | Purpose |
|---|---|---|
| `part-a-blue-starting-point.md` | Give to the responding team | All the team knows at T0: three signals, the fog, the first decisions. |
| `part-b-red-ground-truth.md` | Facilitator only | What really happened: adversary, full ATT&CK kill chain, IOCs, environment weaknesses, detection opportunities, red-team flags, RoE. |
| `example-incident-report.md` | Reference output | An illustrative Incident Response Report produced from Part A only, with the assumptions register surfacing everything inferred but not given. Use it as a quality bar, not a script. |

## How to run it (facilitator note)

Give the blue team **only Part A**. Release Part B facts as *injects* when their
actions would realistically surface them: they only learn "domain admin was
compromised 5 weeks ago" once they pull DC logs; they only learn "backups are
encrypted too" once they try to restore.

The learning lands hardest when the team discovers, mid-exercise, that the tidy
"clean the malware and restore" plan is impossible, because the intruder owned
the domain for two months and the backups are gone. That forces the real
decisions: out-of-band comms, external DFIR, regulator/notification duties, and
the ransom question.

### The beats to reveal, in rough order

1. It is **one intrusion**, not three faults (mail down and encryption share a
   root cause).
2. The **phishing report is patient zero**, not a coincidence, and it is ~69 days
   old.
3. The attacker reached **domain admin ~5 weeks before detonation**, so dwell is
   long and trust in AD is gone.
4. The **mail servers were encrypted** (that is why email is silent); the comms
   channel is a casualty, not a coincidence.
5. The **online backups were reachable and encrypted too**, so restore-from-backup
   is not available and the hard calls escalate.
6. **Exfiltration cannot be fully excluded** (2019-era Clop was encryption-first),
   which shapes the notification decision.

## Which skill each part exercises

This fixture is deliberately cross-skill; it can regression-test four skills and
their hand-offs from one scenario.

| Skill | What it runs on | Expected shape of output |
|---|---|---|
| `infosec-incidentteam` | Part A (+ Part B as injects) | Incident Response Report: triage, containment dial, evidence, legal clocks, decision log, assumptions register. See `example-incident-report.md`. |
| `infosec-redteam` | Part B | Adversary Emulation Plan: TA505 TTPs mapped to ATT&CK, kill chain as atomic tests, detection opportunity per step, RoE. |
| `infosec-blueteam` | Part B weaknesses + detection opportunities | Detection & Hardening Plan: turn each attacker step into a detection, score telemetry coverage, prioritized hardening backlog. |
| `infosec-council` | The forks the incident throws off | Deliberated verdicts on pay/no-pay (with sanctions screening), rebuild-greenfield vs restore, and Art. 34 notification breadth. |

A good end-to-end test: run `infosec-incidentteam` on Part A, let it escalate the
pay/no-pay and rebuild-vs-restore calls to `infosec-council`, and separately run
`infosec-redteam` and `infosec-blueteam` on Part B, then check the blue-team
detections would actually have caught the red-team steps.

## What the example report is good for

The example report is faithful to Part A only. Anything the team could not know
at T0 (that the estate is virtualized, that immutable backups exist, the exact
scope) is not asserted as fact; it sits in the **Assumptions register** with a
verify-owner. Use it to check two things:

- The response reasoning is sound and in the right order.
- Nothing invented is laundered into the timeline or decision log as established.
  Illustrative specifics (relative timestamps, percentages) are marked as
  placeholders, not presented as real readings.

## Provenance and safety

Based on the **publicly documented** 2019 Maastricht University incident and
subsequent public reporting (Fox-IT investigation, the university's own public
account). The IOCs, tooling, and attack chain are already in the public record.
This material is for **authorized emulation, training, and detection tuning
only**. Any live exercise needs scope, authorization, a signed RoE, an isolated
or explicitly authorized range, and an open deconfliction line. Never run live
ransomware against production.
