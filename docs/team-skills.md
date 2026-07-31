# The team skills: red, blue, incident

The council **decides**. Three operational team skills **execute**, each producing a working
artifact instead of a verdict. They ship in the Claude Code / plugin edition alongside the
council, and their seats are grounded in the ENISA European Cybersecurity Skills Framework
(ECSF) role profiles.

| Skill | Trigger | Seats (ECSF roles) | Deliverable |
|---|---|---|---|
| **infosec-redteam** | "red team this", "emulate an attacker", "plan a pentest", "turn this breach into an exercise" | Threat Intelligence Specialist, Penetration Tester, Auditor + Legal (safety lead) | **Adversary Emulation Plan** — ATT&CK kill chain, atomic tests, blue-team detection scorecard |
| **infosec-blueteam** | "blue team this", "build detections", "threat hunt", "harden the estate", "close the gaps" | Incident Responder (SOC), Threat Intelligence Specialist (hunting), Architect + Implementer | **Detection & Hardening Plan** — log-source map, detection rules, hunt hypotheses, hardening backlog |
| **infosec-incidentteam** | "we have an incident", "incident response", "we've been breached", "what do we do first" | Incident Responder, Digital Forensics Investigator, Legal & Compliance (DPO) | **Incident Response Report** — timeline, containment, evidence register, notification clocks, decision log |

## They compose as a lifecycle, not four silos

The **red team** produces a realistic threat. The **blue team** builds detection and hardening
against it. The **incident team** responds when something gets through. The **council** sits
above all three for the hard judgment calls — pay or not, rebuild or restore, notify or not —
that the operational skills escalate rather than settle.

Red plus blue closing the loop, scoring which emulated steps the defences would actually catch,
is the purple-team exercise.

All four skills share one `frameworks.md` (the 5x5 risk scale, the EU-SME regulatory register)
so a rule change propagates everywhere.

## Safety, where it matters

- The **red team** runs only under a signed Rules of Engagement, against an isolated range or
  an authorized segment. Never live production ransomware. The safety lead holds a hard veto.
- The **incident team** preserves evidence before remediating, and gates notification and data
  sharing on the legal clocks.

See also [model safety controls and the Cyber Verification
Program](how-it-works.md#model-safety-controls-and-the-cyber-verification-program).

## Running them

Each triggers by slash command or natural language, and returns a Markdown deliverable rather
than a council verdict. Each can also render its own branded HTML dossier — see
[Reports and the decision journal](reports-and-journal.md).

```
/infosec-redteam plan an authorized adversary-emulation exercise against our flat Active
Directory estate (~1,600 servers, no SOC): pick a realistic ransomware actor, map its TTPs,
and build the emulation plan (isolated range, signed RoE).
```

```
/infosec-blueteam here is a set of attacker TTPs (or a red-team plan). Build detections and a
hardening backlog, and score which steps we would actually catch.
```

```
/infosec-incidentteam mail is down, files are turning up encrypted, and there was a phishing
report weeks ago. Run the response: triage, containment, evidence, and the notification clocks.
```

A red-team plan feeds the blue team — that is the purple-team loop — and any hard call that
surfaces inside a response is escalated to the council.

## The bundled exercise

`.claude/skills/infosec-shared/examples/um-ransomware-2019/` holds a cross-skill exercise
fixture built on a documented 2019 ransomware case (TA505/Clop), split into a blue-team
starting point and red-team ground truth. It doubles as a regression scenario across all four
skills, and each team generator can render it with `--example`.
