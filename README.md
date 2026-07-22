# Luméro Information Security Council

**Make a high-stakes security, privacy, compliance or risk decision with a panel of seven domain experts: they debate it, challenge each other anonymously, and return one calibrated verdict, now with the statutory obligations the decision triggers surfaced explicitly. Beside the council sit three operational team skills, red (adversary emulation), blue (detection and hardening) and incident (live response), that do the operational work and escalate the hard judgment calls back up to it. Calibrated to EU-SME reality.**

[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE) [![Content: CC BY-SA 4.0](https://img.shields.io/badge/content-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-CC-BY-SA-4.0.txt) [![Install: npx](https://img.shields.io/badge/install-npx-success.svg)](#install) [![Editions: CLI + Desktop + GPT](https://img.shields.io/badge/editions-CLI%20%2B%20Desktop%20%2B%20GPT-purple.svg)](#install) [![ChatGPT GPT](https://img.shields.io/badge/ChatGPT-Try%20the%20GPT-10A37F.svg?logo=openai&logoColor=white)](https://chatgpt.com/g/g-6a3c32a5a78c8191b28254c342c1bd08-infosec-council-by-lumero) [![Website](https://img.shields.io/badge/website-lumero.nl-orange.svg)](https://lumero.nl) [![LinkedIn: Luméro](https://img.shields.io/badge/LinkedIn-Lum%C3%A9ro-0A66C2.svg?logo=linkedin&logoColor=white)](https://www.linkedin.com/company/Lum%C3%A9ro) 

> **Disclaimer - informational, not professional advice.** This council is a
> decision-support tool that role-plays security, privacy, compliance, and risk
> perspectives. Its output is **not** legal, regulatory, or professional security
> advice, may be incomplete or wrong, and is provided **with no warranty**. You
> remain responsible for your decisions. Validate anything material with a
> qualified professional. See the license files for the full warranty disclaimers. It is a
> point-in-time read, not continuous monitoring; re-run it when the decision, the facts, or the
> rules change.


Stress-test a high-stakes decision before you commit, including the hard judgment calls inside a
live incident or situation. An expert panel of seven security
advisors deliberates it, peer-reviews each other anonymously, forces a debate when agreement
looks too clean, and returns one synthesized verdict. Built for European **SME** reality:
limited budget, limited headcount, heavy reliance on SaaS and third parties.

It's a **persona council**, one model running as several sub-agents with
deliberately conflicting mandates. The disagreement is the product.

As of **v1.7.0** the council is the decision layer of a small **suite**. Three operational team
skills (red, blue, incident) sit beside it and produce working artifacts instead of a verdict, and
the council handles the hard judgment calls they escalate. See [The team skills](#the-team-skills-red-blue-incident)
below. Risk is now rated on a standard **5x5** heat map (see [Frameworks](#frameworks--baselines-one-place-to-maintain)).

> Design note: the council architecture, the depth modes (Quick/Standard/Deep), the anonymized
> peer review, the forced debate when consensus looks too clean, the chairman synthesis with a
> minority report, and the decision journal, is adapted from
> [`TorpedoD/claude-council`](https://github.com/TorpedoD/claude-council), an open-source
> multi-agent decision framework. This edition fixes a panel of security *domain experts*
> (rather than general thinking lenses), so the verdict maps directly onto security, privacy,
> compliance, and risk decisions. Among other things, the attack and detection pre-mortems are its own additions.

### What makes this council different

The defensible differentiators, in order:

1. **The calibration journal with outcomes.** Every run is logged with each seat's stance, a confidence level, and a numeric probability. You record later how the decision actually turned out, and `council meta` scores the panel with a Brier score and an Expected Calibration Error plus a reliability curve, not just a hit-rate. Over time you learn whether its "high confidence" is worth anything (and exactly where it is over- or under-confident), which is the one thing a one-shot answer can never tell you.
2. **The EU-SME regulatory register.** A single maintained file (`frameworks.md`) carries the in-scope regimes, the control baseline, and the canonical standard versions, each with a "last verified" date. The advice is calibrated to Dutch and EU small-business reality, not a generic global default.
3. **The build/break/run triad.** The Security Architect (build it securely), Offensive Security (break it), and Security Operations (see and survive it failing) are deliberate counterweights. Where they disagree on feasible-versus-detectable is itself a finding.
4. **The attack and detection pre-mortems.** The red-team and operations seats reason backwards from a breach that has already happened, which surfaces failure paths a forward-looking design review misses.

Everything else in the mechanism (independent first-round analysis, anonymized cross-examination, forced debate, the minority report) is shared with the wider "LLM council" family and is there to fight one failure mode: a panel that agrees by conformity instead of by reasoning.

## The team skills: red, blue, incident

The council **decides**. Three operational team skills **execute**, each producing a working artifact instead of a verdict. They ship in the Claude Code / plugin edition alongside the council, and their seats are grounded in the ENISA European Cybersecurity Skills Framework (ECSF) role profiles.

| Skill | Trigger | Seats (ECSF roles) | Deliverable |
|---|---|---|---|
| **infosec-redteam** | "red team this", "emulate an attacker", "plan a pentest", "turn this breach into an exercise" | Threat Intelligence Specialist, Penetration Tester, Auditor + Legal (safety lead) | Adversary Emulation Plan (ATT&CK kill chain, atomic tests, blue-team detection scorecard) |
| **infosec-blueteam** | "blue team this", "build detections", "threat hunt", "harden the estate", "close the gaps" | Incident Responder (SOC), Threat Intelligence Specialist (hunting), Architect + Implementer | Detection & Hardening Plan (log-source map, detection rules, hunt hypotheses, hardening backlog) |
| **infosec-incidentteam** | "we have an incident", "incident response", "we've been breached", "what do we do first" | Incident Responder, Digital Forensics Investigator, Legal & Compliance (DPO) | Incident Response Report (timeline, containment, evidence register, notification clocks, decision log) |

They compose as a lifecycle rather than four silos: the **red team** produces a realistic threat, the **blue team** builds detection and hardening against it, the **incident team** responds when something gets through, and the **council** sits above all three for the hard judgment calls (pay or not, rebuild or restore, notify or not) that the operational skills escalate rather than settle. Red plus blue closing the loop, scoring which emulated steps the defenses would catch, is the purple-team exercise. All four share one `frameworks.md` (the 5x5 risk scale, the EU-SME regulatory register) so a rule change propagates everywhere.

Safety is built in where it matters: the red team runs only under a signed Rules of Engagement against an isolated range or an authorized segment, never live production ransomware; the incident team preserves evidence before remediating and gates notification and data sharing on the legal clocks.

### Model safety controls and the Cyber Verification Program (CVP)

Claude's most capable models (Opus, Sonnet, and Fable) run real-time cyber safeguards that
automatically detect and block requests that look like prohibited or high-risk cybersecurity
use. The decision council rarely trips these; the operational skills, above all the red team's
adversary-emulation output, are the dual-use part most likely to be interrupted.

- **Prohibited use stays blocked, by design.** Mass data exfiltration, live-production
  ransomware, and the like have no legitimate defensive use and cannot be unblocked. The team
  skills are built to stay well clear of that line (signed Rules of Engagement, isolated range
  or authorized segment only, evidence before remediation, notification gated on the legal clocks).
- **Legitimate dual-use work can be verified.** Adversary emulation, vulnerability testing, and
  detection engineering may be blocked or interrupted by default. Anthropic runs a free,
  application-based **Cyber Verification Program (CVP)** that lifts these dual-use restrictions
  for verified cybersecurity practitioners (some account types and platforms, such as
  Zero-Data-Retention accounts and Bedrock/Vertex, are excluded; check the guide for current
  eligibility). Apply with your Organization ID through Anthropic's Cyber Use Case Form; decisions
  typically arrive within two business days. See [Anthropic's cyber safeguards guide](https://support.claude.com/en/articles/14604842-real-time-cyber-safeguards-on-claude).

**Luméro participates in the CVP** and runs these engagements under proper authorization, so if you
would rather not manage verification and Rules of Engagement yourself, [we can run them for you](https://lumero.nl).

## Install

**Claude Desktop / Claude.ai – no terminal, easiest for non-technical users.**
Download **[`infosec-council-desktop.zip`](https://github.com/Menno-MBA/infosec-council/releases/latest/download/infosec-council-desktop.zip)**
from the latest release. In the app: **Settings → Capabilities** (turn on *Code
execution & file creation* and *Skills*) → **Skills → Upload skill** → choose the
file. Then in any chat type: `ask the infosec-council: <your decision> -deep`.

**ChatGPT (custom GPT) – nothing to install, just open it.**
Use the council straight inside ChatGPT: **[Information Security Council by Luméro](https://chatgpt.com/g/g-6a3c32a5a78c8191b28254c342c1bd08-infosec-council-by-lumero)**. Type your decision and add `-deep` for the full treatment. Requires a ChatGPT account; keep *Code Interpreter* on so it can generate the branded HTML report.

**Claude Code (CLI) – one command.**

```bash
npx github:Menno-MBA/infosec-council            # install into this project
npx github:Menno-MBA/infosec-council --global   # install for every project
```

**Claude Code plugin (works in Cowork on desktop too) – marketplace install.**

```
/plugin marketplace add Menno-MBA/infosec-council
/plugin install infosec-council@lumero
```

The full suite (the council plus the red, blue, and incident team skills), packaged as a versioned
Claude Code plugin. It runs in the terminal and in Cowork on the desktop app, where it dispatches
the real sub-agents rather than role-playing them in one context like the uploadable skill does.
Updates arrive through `/plugin update` when a new version ships, and the plugin never overwrites
your tuned `context.md` or `frameworks.md`.

> The download zips are built automatically by CI and attached to each release;
> nothing binary is committed to the repo. Maintainers: see *Publish* below.

## Use

In Claude Code (CLI), call the skill explicitly with its slash command, followed by
your decision and (optionally) a depth mode:

```
/infosec-council we want to let the team use a new AI note-taker that joins our
customer calls and stores transcripts. ~25 staff, B2B SaaS, SOC 2 in progress.
Should we, and under what conditions? -deep
```

It also responds to natural language (in Claude Code, and in Claude.ai/Desktop once the
skill is enabled). "convene the council", "council this", and "ask the panel for advice" trigger it too:

```
ask the infosec-council: <your decision> -deep
```

Append `-quick`, `-standard`, or `-deep` to set the depth (default: Standard), or the
experimental `-boardroom` for live cross-talk (see [Depth modes](#depth-modes)). The richer
the context (size, sector, data types, frameworks you carry, constraints), the sharper
the verdict. The council runs independent analysis, anonymized cross-examination (with
forced debate when agreement is too clean, and rotated, length-normalized peer scoring to
blunt order and verbosity bias), and a chairman synthesis that ends with a recommendation,
a confidence level, a minority report, and one concrete next step.

**It assesses live incidents too, not just forward decisions.** For example:

```
ask the infosec-council: a phishing email led to a compromised Microsoft 365 account with new
mailbox forwarding rules. What is the blast radius, the response, and our GDPR and NIS2
notification duties? -deep
```

### Running the team skills

The three operational skills trigger the same way, by slash command or natural language. Each
returns a Markdown deliverable rather than a council verdict, and each can also render its own
branded, self-contained HTML dossier (see [Reporting](#reporting-branded-html-dossiers)):

```
/infosec-redteam plan an authorized adversary-emulation exercise against our flat Active
Directory estate (~1,600 servers, no SOC): pick a realistic ransomware actor, map its TTPs,
and build the emulation plan (isolated range, signed RoE).

/infosec-blueteam here is a set of attacker TTPs (or a red-team plan). Build detections and a
hardening backlog, and score which steps we would actually catch.

/infosec-incidentteam mail is down, files are turning up encrypted, and there was a phishing
report weeks ago. Run the response: triage, containment, evidence, and the notification clocks.
```

They compose: a red-team plan feeds the blue team (the purple-team loop), and any hard call that
surfaces inside a response (pay or not, rebuild or restore, notify or not) is escalated to the
council. See [The team skills](#the-team-skills-red-blue-incident) for the seats and deliverables.

## Depth modes

Append a depth flag (`-quick`, `-standard`, `-deep`, or the experimental `-boardroom`) to your question, or let the council pick (defaults to Standard).

| Mode | When | Members | Peer review + ranking | Debate |
|---|---|---|---|---|
| **Quick** | Low-stakes, reversible in a day | 3 most relevant (keeps >= 1 adversarial seat) | No | No |
| **Standard** | Default | All 7 | Yes | Only if consensus is suspiciously clean |
| **Deep** | High-stakes, costly to reverse | All 7 + decision-science pass + synthesis audit | Yes | Always |
| **Boardroom** | High-stakes, and you want live cross-talk | All 7 as agent-teams teammates | Yes (live) | Always |

Every member ends with a **required output block** (stance / confidence / probability /
assumptions / what would change my mind / unknowns) so the verdict is calibrated, not just
asserted. The **stance** (go / conditional-go / no-go / defer / reframe) makes the convergence
and debate triggers mechanical; the **probability** (a number, not just low/med/high) is what the
decision journal scores over time.

**Boardroom mode** runs the panel as live [agent-teams](https://code.claude.com/docs/en/agent-teams)
teammates who cross-examine each other directly instead of through the chairman. It needs the
experimental flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`; without it, `-boardroom` falls back to
Deep. Independence still comes first (each seat commits its own position before reading the others),
and the round cap still holds, because live peer exchange is exactly where agreement-by-conformity
compounds.

**How the room converges.** After the anonymized cross-examination, each seat scores the others on
how well their position would survive scrutiny (1 to 5). The council then reads the stances: if the
panel genuinely converged after being challenged it stops early; if it agreed too easily it is pushed
through a forced debate where the dissenter must write a concrete pre-mortem ("it is 12 months later
and this failed, here is the story"); if it stays split, the split is reported as a real trade-off
rather than smoothed away. Deliberation is capped at two exchanges (three in Deep and Boardroom),
because more rounds trade tokens for conformity, not accuracy.

**Grounding.** Any seat that leans on a regulation's status, a deadline, a standard version, or a
vendor fact that could have moved must verify it against a primary source or mark it `UNVERIFIED`;
the chairman lists any unverified load-bearing fact next to the confidence, so you can see what the
verdict is standing on.

## The expert panel

The suite runs sixteen seats across four skills. The council's seven deliberate the decision; the nine team seats, grounded in the ENISA ECSF role profiles, do the operational work. The **Skill** column shows which one each belongs to.

| Seat | Skill | Mandate | Anchors to |
|---|---|---|---|
| CISO | Council | Posture vs. business enablement, budget, incident readiness | ISO 27001 (ISMS), NIST CSF, CIS Controls (IG1) |
| Security Architect | Council | Secure-by-design & default; configures/hardens bought SaaS, identity-first (build) | Threat modeling (STRIDE), secure-by-design, CIS Benchmarks, zero trust |
| Offensive Security Engineer (Red Team) | Council | Attacker's view, attack pre-mortem, exploitation chains (break) | MITRE ATT&CK; attacker's-eye view |
| Security Operations | Council | Detection, response & recovery (run/survive); MDR + owned-tool alerts + tested IR plan | NIST CSF (detect/respond/recover), NIST incident-response guidance, MITRE ATT&CK, tested backups, GDPR breach handoff |
| Compliance Analyst | Council | Maps mandatory EU law vs chosen attestations; evidence + crosswalks ("comply once, satisfy many") | EU regimes in scope (GDPR, NIS2, EU AI Act; DORA/CRA/PCI DSS where applicable), ISO 27001, SOC 2 |
| DPO / Privacy | Council | Lawful, fair, transparent processing; advises & monitors (controller decides) | EU/EEA GDPR (lawful basis, ROPA, DPIA, transfers), ePrivacy, EU AI Act |
| Risk Manager | Council | Structures & frames risk two-sidedly (owner owns, mgmt accepts); third-party risk | ISO 31000/27005 (right-sized), CIS RAM, NIST small-business guidance, cyber insurance |
| Threat Intelligence (`redteam-threat-intel`) | Red team | Selects a realistic adversary to emulate, maps its TTPs, sets the objectives and flags | ECSF Cyber Threat Intelligence Specialist; MITRE ATT&CK; threat-actor profiles |
| Penetration Tester (`redteam-operator`) | Red team | Executes the kill chain as atomic tests, scores each detection opportunity | ECSF Penetration Tester; MITRE ATT&CK; Atomic Red Team / Caldera |
| Safety Lead (`redteam-safety-lead`) | Red team | Owns authorization, Rules of Engagement, scope, deconfliction; hard veto | ECSF Cybersecurity Auditor + Legal; signed RoE, isolated range |
| Detection Engineer (`blueteam-detection-engineer`) | Blue team | Log-source coverage map and detection rules built from attacker TTPs | ECSF Incident Responder (SOC/SIEM); MITRE ATT&CK, D3FEND, sigma |
| Threat Hunter (`blueteam-threat-hunter`) | Blue team | Assume-breach hunt hypotheses for what detection cannot cover | ECSF CTI Specialist; MITRE ATT&CK; hypothesis-driven hunting |
| Hardening Architect (`blueteam-hardening-architect`) | Blue team | Control-gap analysis and the prioritized hardening backlog | ECSF Architect + Implementer; CIS Controls, D3FEND |
| Incident Commander (`incident-commander`) | Incident team | Triage, containment as a dial, eradicate and recover, the decision log | ECSF Cyber Incident Responder; NIST IR, CSIRT coordination |
| Forensics Lead (`incident-forensics-lead`) | Incident team | Evidence and chain of custody, timeline, the exfiltration read | ECSF Digital Forensics Investigator; forensic imaging, chain of custody |
| Legal & Comms (`incident-legal-comms`) | Incident team | Notification clocks, breach register, external-comms gate | ECSF Legal/Compliance + DPO; GDPR Art 33/34, NIS2/Cbw |

The three security seats form a deliberate triad – Architect (*build* it securely),
Offensive Security (*break* it), and Security Operations (*see and survive* it failing).
That tension keeps the room from drifting into "just add another control nobody tests
or monitors." When offense and operations disagree on feasible-vs-detectable, that gap
is itself a finding.

## Three ways to run it

The editions differ in one decisive way: Claude Code has real sub-agents, while Claude.ai/Desktop and the ChatGPT GPT role-play the panel in a single context. Same council, three editions, one repo. The three operational team skills (red, blue, incident) ship with the Claude Code / plugin edition only; the Claude.ai/Desktop and ChatGPT editions remain the council on its own.

| | Claude Code (CLI) | Claude.ai / Desktop (& Cowork) | ChatGPT (custom GPT) |
|---|---|---|---|
| Install | filesystem `.claude/` (no upload) | upload a skill ZIP in Settings | open the GPT link (nothing to install) |
| Advisors | 7 isolated sub-agents, dispatched in parallel | 7 personas role-played in **one** context | 7 personas role-played in **one** context |
| Persistent journal | yes (`~/.infosec-council/journal.jsonl`) | no – sandbox resets per session (export the HTML report instead) | no (export the HTML report) |
| HTML report | yes | yes (runs in the code-execution sandbox) | yes (via Code Interpreter) |
| Best for | the full, isolated multi-agent experience | quick access in the app, sharing via uploaded skill | anyone who lives in ChatGPT; zero setup |

### Path A – Claude Code (CLI)
Requires Claude Code v2.1+. The decision journal needs `jq`; the HTML report needs only Node (or `jq` for the bash version).

**Recommended models (cost vs quality).** Run Claude Code itself on **Opus** (it does the
framing and the final synthesis), while the seven advisors run as sub-agents on **Sonnet**
(set with `model: sonnet` in each persona file). Opus for everything works but burns far more
tokens. To force the advisors onto Sonnet regardless of your session model, set the environment
variable `CLAUDE_CODE_SUBAGENT_MODEL=sonnet`.

**Fastest – install with npx** (no clone; runs straight from this repo):

```bash
npx github:Menno-MBA/infosec-council            # install into ./.claude (this project)
npx github:Menno-MBA/infosec-council --global   # install into ~/.claude (every project)
```

Add `--force` to overwrite an existing install. **There is no auto-update:** to move to a
newer version later, re-run the same command with `--force` and `@main` (the `@main` skips
the npx cache), for example `npx --yes github:Menno-MBA/infosec-council@main --force`. Once
published to npm, plain `npx infosec-council` works too.

**Or clone and run** (agents + skill are auto-detected at project scope):

```bash
git clone https://github.com/Menno-MBA/infosec-council.git
cd infosec-council
claude                       # run from the repo → agents + skill are auto-detected (project scope)
```

To make it available in **every** project without npx, install globally (or
`npx github:Menno-MBA/infosec-council --global`):

```bash
bash scripts/install-cli.sh  # copies agents → ~/.claude/agents, skill → ~/.claude/skills
```

### Updating

npx does not auto-update; it keeps the version you first installed. To upgrade, re-run the
install with `--force` and the **latest release tag** (the tag also avoids a stale download cache):

```bash
npx github:Menno-MBA/infosec-council#v2.0.0 --force --global
```

Use the newest tag from the [Releases](https://github.com/Menno-MBA/infosec-council/releases)
page. The installer prints the version it set; check yours anytime with
`npx github:Menno-MBA/infosec-council --version`. Then close and reopen Claude Code so it loads
the new version. (Still seeing the old text? An older copy in your home folder is being used; the
`--global` re-install above overwrites it.)

### Path B – Claude.ai / Desktop / Cowork
Build the uploadable skill, then add it in the app.

```bash
bash scripts/build-desktop-skill.sh   # writes dist/infosec-council-desktop.zip
# or, cross-platform (no bash/zip needed):
npx github:Menno-MBA/infosec-council build-desktop
```

In the app: **Settings → Capabilities**, turn on *Code execution and file creation* and
*Skills*; then **Customize → Skills** (Team/Enterprise: *Settings → Skills* first) →
**+ Create skill / Upload skill** → choose `dist/infosec-council-desktop.zip`. Toggle it
on. Then in any chat: `ask the infosec-council: <your decision> -deep`. (On Free/Pro/Max the
Skills upload lives under Customize → Skills; on Team/Enterprise an owner must enable
Skills org-wide first.)

## Reporting: branded HTML dossiers

Every skill in the suite turns its work into a branded, self-contained HTML dossier in the
Luméro house style. All four generators share one brand shell, the same palette, typography,
tables, 5x5 risk-exposure bar, status pills, and TLP marking, so a reader who has seen one
Luméro report reads all of them the same way. Each is a zero-dependency Node `report.js` that
reads a JSON object on stdin (or `--in <file>`), base64-embeds the Luméro logo and fonts, and
writes one portable `.html` file that renders identically offline with no external requests.

| Skill | Generator | Dossier | Signature sections |
|---|---|---|---|
| **infosec-council** | `report.js` (+ `report.sh`) | Security Decision Dossier | recommendation + confidence, executive summary, 5x5 risk bar, regulatory-obligations ledger, decision-science options, agree/disagree, minority report, each advisor |
| **infosec-redteam** | `report.js` | Adversary Emulation Plan | exec + scorecard tiles, scope/RoE, emulated adversary, ATT&CK kill-chain table, blue-team detection scorecard, findings, safety attestation |
| **infosec-blueteam** | `report.js` | Detection & Hardening Plan | coverage tiles, TTP scope, log-source coverage map, ATT&CK coverage heatmap, detection-rule table, hunt cards, ranked hardening backlog, purple-team scorecard |
| **infosec-incidentteam** | `report.js` | Incident Response Report | severity banner, notification tracker with live deadline countdowns, breach register, timeline, containment dial, evidence register, decision log, eradication gates, comms log |

The council additionally ships `report.sh` (bash + `jq`) as an alternative to its Node generator,
and can render from the journal by sha. The three team generators are Node-only, take their JSON
on stdin, and each bundles a runnable sample (the shared TA505/Clop exercise) behind `--example`.

```bash
# council, from a fresh run (it does this for you) or from the journal by sha:
node .claude/skills/infosec-council/report.js --sha <sha>

# a team skill, from a JSON deliverable (or the bundled sample):
node .claude/skills/infosec-redteam/report.js      < plan.json
node .claude/skills/infosec-blueteam/report.js     --example
node .claude/skills/infosec-incidentteam/report.js < incident.json
```

In Claude Code, just ask for "a report" after any run (or "a report for <sha>" for the council).

## Decision journal

The council logs each run and lets you record how the decision actually turned out,
so you can see over time whether your high-confidence calls are trustworthy. Two
interchangeable scripts ship with the skill: `journal.js` (Node, zero dependencies,
the default, and the one that works on Windows and inside the Desktop/Cowork sandbox)
and `journal.sh` (bash, needs `jq`). You do not need `jq` if you have Node.

- Every council run is appended automatically to `~/.infosec-council/journal.jsonl`
  (override the location with `COUNCIL_HOME`; set `COUNCIL_ORG` to keep one client's
  journal and house-context out of another's, which matters for consultancies). The
  council tells you each run's `sha`, and stores a stable `family` id so reruns of the
  same decision stay linked.
- Record the outcome later, once the decision plays out:
  `council outcome <sha> correct|partial|wrong "short note"`
- See calibration: `council meta` gives hit-rate **and a Brier score** by confidence
  level (the Brier score uses each run's numeric probability, so it is a real calibration
  measure, not just a bucket count), the high-confidence calls that didn't pan out (the
  ones worth learning from), and member appearance counts.
- Recent runs: `council journal [n]`. Comparable past runs before a new decision:
  `council lookback "<the decision>"` (the council also does this automatically before
  Round 1, so a similar past outcome informs the new verdict).

In Claude Code you just type these in natural language ("council meta", "outcome
9615ee5e partial, the DPA had gaps") and the skill routes them to the script.

Your journal is data, not code; it lives outside the repo and is gitignored.

## Frameworks & baselines (one place to maintain)

All regulations, standards, guidelines, and technologies live in
`.claude/skills/infosec-council/frameworks.md`, not scattered across the personas. It has:

- **Part A – configuration knobs** you flip once: the **control baseline** (currently
  `CIS Controls IG1` → change to `IG2`/`IG3` to re-level the whole council), jurisdiction,
  backup standard, MFA standard, default risk posture, quantification depth.
- **In-scope regimes** toggle: GDPR, ePrivacy, NIS2/Cbw, DORA, EU AI Act, CRA, PCI DSS,
  SOC 2 – flip a regime to "in scope" and the relevant seats treat it as live.
- **Part B – reference register**: every subject with its canonical version/level and a
  **cross-reference column** showing which personas cite it.
- **Part C – obligation registry**: conditional obligations (statutory reporting and the like),
  each with a trigger, a determination owner, execution owner(s), a clock, a recipient, and a
  statutory ref. The council evaluates every row before it deliberates (see below).

The personas reference subjects **by name** and inherit the detail from here, and the
orchestrator injects `frameworks.md` into every member at deliberation time, so a single
edit (e.g. IG1 → IG2, or a PCI DSS version bump, or bringing NIS2 into scope) propagates
to all seven seats with no per-persona edits. Maintain catalog facts there; keep the
persona files for the static *traits* (mandate, method, biases, lane, output contract).

The **5x5 risk matrix** lives here too (impact negligible to severe, likelihood rare to almost
certain, each 1 to 5, scored out of 25 and banded Low / Moderate / High / Critical), and all four
skills rate risk on it. The council report shows both inherent and residual exposure as two markers
on one bar, and an already-observed impact is scored Almost certain, not Possible.

### Obligation registry & the determination layer

Some duties are not opinions to be argued; they either apply or they do not. `frameworks.md`
**Part C** is a config-driven **obligation registry** (statutory reporting and similar), and before
Round 1 the council runs a **determination pass**: the determination owner for each row (Compliance
or the DPO) returns it as **TRIGGERED** (a required action with an owner, a clock, and a recipient) or
**NOT TRIGGERED** (with a one-line reason). Determination is split from **execution**, so a
cross-cutting duty like outbound incident reporting is never collapsed into one seat and silently
dropped.

Two things make it structural rather than hopeful. The forced NOT-TRIGGERED line turns absence into a
decision on the record. And a second Chairman gate, **Gate B**, blocks the synthesis from closing
while any TRIGGERED obligation lacks a matching action with an owner and a clock; consensus does not
override a missing statutory action. The dossier renders both as a **Regulatory obligations** section
under the risk rating: a required-actions table plus an explicit-negative ledger of what was
considered and ruled out, which doubles as ISO 27001 Annex A / NIS2 governance evidence. Register a
new obligation by adding one row to Part C, with no code change.

**Registered by default** (edit or extend in `frameworks.md` Part C):

| Obligation | Trigger | Owner (determine → execute) | Clock |
|---|---|---|---|
| GDPR breach to the DPA (Art. 33) | personal-data breach with risk to individuals | DPO → DPO | 72h |
| GDPR notice to individuals (Art. 34) | high risk to individuals | DPO → DPO + CISO | without undue delay |
| NIS2 early warning / notification / final report (Art. 23) | NIS2/Cbw in scope and a significant incident | Compliance → CISO + Legal & Comms | 24h / 72h / 1 month |
| NIS2 IoC sharing (Art. 29) | a CERT/CSIRT affiliation exists | Compliance → Security Operations | voluntary |

Three more ship as candidate rows (DPIA Art. 35, Art. 28 processor terms, control-baseline shift), each addable as one line.

### Strategic context (`context.md`)

Alongside the regulatory config, a second file, `context.md`, holds the organization's
**strategic** config and is injected into every member too: standing architecture
preferences (e.g. "Art. 9 / trade-secret data stays on an own EU endpoint, not
vendor-orchestrated"), categorical risk-appetite boundaries (what is out of appetite
regardless of ROI), and prior strategic decisions / preferred vendors and patterns. It
ships as a fill-in template; the council also appends durable organization facts to its
auto-context block over time.

One deliberate guardrail: house positions in `context.md` are **defaults, not doctrine**.
The orchestrator injects an explicit licence for any seat to challenge a house position
(and to say so when it overrides one), so the file informs the council without quietly
turning an adversarial panel into a confirmation machine.

To use it, fill in Parts A to C with your organization's house positions; the council reads `context.md` automatically and writes only to the Part D auto-context block.

### Grounding: the output is only as good as what you feed it

The council reasons over what it is grounded in, so the quality of the verdict tracks the quality of the inputs. Three layers of grounding matter, in order of impact:

1. **The question** – concrete situation, constraints, and what decision you actually face. A vague prompt yields a generic answer; a specific one ("we run Microsoft 365 Business Premium, 40 staff, no in-house IT, considering Copilot") lets the seats reason about *your* reality.
2. **Strategic context** (`context.md`) – your organization's house positions, risk-appetite boundaries, architecture preferences, and prior decisions. Without it the council assumes a generic EU SME; with it the advice is calibrated to how you actually operate.
3. **Framework detail** (`frameworks.md`) – the in-scope regimes, the control baseline, and the canonical standard versions/levels the seats cite. The fuller and more accurate this catalog, the more precise the compliance and control reasoning.

Treat the result as a point-in-time read, calibrated to the context you supplied. Thin grounding gives a sound but generic answer; rich grounding gives advice specific enough to act on. Re-run it when the question, the facts, or the rules change.

## Customize

- **Add a member or a team seat**: drop `.claude/agents/<role>.md`, add it to the relevant
  SKILL.md, and (for the plugin) list it in `plugin.json`. The Threat-Intel and IR/Forensics
  roles once suggested here now ship as team personas (red, blue, incident); Identity & Access
  is still an open candidate.
- **Re-tune biases**: the council's value depends on members genuinely disagreeing.
  If two members always agree, sharpen their conflicting mandates.
- **Swap regulatory anchors** to your jurisdiction/sector (e.g. HIPAA, DORA, FedRAMP).

## Roadmap

Direction is maintainer-led: Luméro curates the core council logic so every edition (CLI,
Desktop, GPT) behaves the same. The items below are under consideration, not commitments.
Suggestions are welcome (see [Contributing](#contributing)), and because the project is open
(CC BY-SA) you are free to fork and change the logic yourself.

**Recently shipped (v2.0.0)**: the suite reaches parity and gets hardened. All three operational
team skills now emit their own **branded HTML dossiers** (Adversary Emulation Plan, Detection &
Hardening Plan, Incident Response Report) sharing one brand shell with the council, so every skill
produces a portable, offline-rendering report, not just the council. The council mechanism gains
**state-of-the-art bias controls** (rotated, length-normalized anonymized peer scoring to blunt the
order and verbosity biases an LLM judge falls for) and a richer **calibration read** (Expected
Calibration Error and a reliability curve beside the Brier score). And the codebase is
**security-hardened**: input JSON is escaped by default (three injection fixes), a **SHA-256
integrity manifest** with an `infosec-council verify` command gives tamper-evidence, and a new
[SECURITY.md](SECURITY.md) documents the threat model. This 2.0 milestone also consolidates the
v1.7.x conditional-obligation layer and 5x5 risk matrix and the v1.8.x assumptions guardrail below.
See `CHANGELOG.md`.

**Shipped in v1.8.x**: an **observed-vs-assumed guardrail** for the incident team. When a
commander fills a gap under pressure (assuming the estate is virtualized, that immutable backups
exist, and so on), that inference is tagged `[ASSUMED - verify: <owner>]`, collected in an
**assumptions register**, and blocked by a synthesis gate from hardening into the record as fact. Ships
with a portable incident **HTML report generator** and a **cross-skill exercise fixture** (a TA505/Clop
ransomware scenario under `infosec-shared/examples/`, split into a blue-team starting point and
red-team ground truth) that doubles as a regression scenario across all four skills. See `CHANGELOG.md`.

**Recently shipped (v1.7.1)**: a **conditional-obligation layer**. `frameworks.md` now carries an
obligation registry (Part C); the council runs a determination pass before deliberating (each
statutory duty returned as triggered, or explicitly ruled out on the record), a second Chairman
gate blocks the synthesis from closing while a triggered obligation lacks an owner and a clock, and
the dossier renders a **Regulatory obligations** section usable as ISO 27001 / NIS2 evidence. See `CHANGELOG.md`.

**Recently shipped (v1.7.0)**: a standard **5x5 risk matrix** (inherent and residual exposure, with
observed-impact anchoring), an optional report **subtitle**, and three operational **team skills**
(`infosec-redteam`, `infosec-blueteam`, `infosec-incidentteam`) with seats grounded in the ENISA
ECSF role profiles, plus a router in the council so operational requests reach the right skill
instead of a decision dossier. See `CHANGELOG.md`.

**Recently shipped (v1.6.0)** implements the July 2026 mechanism review (see `CHANGELOG.md`
and the full report `council-mechanism-review-2026-07-11.md`): stance and probability in the
output block, Brier-scored calibration, convergence detection with early stopping, a scored
anonymous ranking, a synthesis audit, Boardroom (agent-teams) mode, a grounding rule, per-org
journals, a Node journal, and packaging as a Claude Code plugin. Because each run now records
every seat's stance and probability, the per-advisor calibration below is finally unblocked.

- **Per-advisor calibration**: over time, track which advisor's dissent most often turns out
  to be right, so the council can learn whose warnings to weight more heavily. The prerequisite
  (recording each advisor's stance per run) now exists; what remains is comparing those stances
  against the outcomes you log later.

## Repository structure

One repo serves both Claude Code (CLI) and Claude.ai/Desktop. Personas, scripts, and
assets have a single source of truth under `.claude/`; the desktop skill is assembled
from them by a build script.

```
infosec-council/
├── README.md
├── CHANGELOG.md                              # what changed per release
├── LICENSE                                   # MIT (the code)
├── LICENSE-CC-BY-SA-4.0.txt                  # CC BY-SA 4.0 (the council content)
├── package.json                              # npx installer metadata
├── .gitignore
├── .claude-plugin/                           # ← makes the repo a Claude Code plugin + marketplace
│   ├── plugin.json                           #   plugin manifest (points at .claude/ sources)
│   └── marketplace.json                      #   one-line `/plugin marketplace add` distribution
├── bin/
│   └── cli.js                                # npx installer / desktop-zip + plugin-zip builder
├── .github/
│   └── workflows/
│       └── release.yml                       # CI: builds + attaches the desktop zip on tag
├── .claude/                                  # ← Claude Code (CLI) reads this directly
│   ├── agents/                               #   sub-agents (CLI/plugin): 7 council + 9 team seats
│   │   ├── ciso.md                           #   council: the seven deliberation seats
│   │   ├── security-architect.md
│   │   ├── offensive-security.md
│   │   ├── security-operations.md
│   │   ├── compliance-analyst.md
│   │   ├── dpo.md
│   │   ├── risk-manager.md
│   │   ├── redteam-operator.md               #   red team seats (ECSF-grounded)
│   │   ├── redteam-threat-intel.md
│   │   ├── redteam-safety-lead.md
│   │   ├── blueteam-detection-engineer.md    #   blue team seats
│   │   ├── blueteam-threat-hunter.md
│   │   ├── blueteam-hardening-architect.md
│   │   ├── incident-commander.md             #   incident team seats
│   │   ├── incident-forensics-lead.md
│   │   └── incident-legal-comms.md
│   └── skills/
│       ├── infosec-redteam/                  #   red team -> Adversary Emulation Plan
│       │   ├── SKILL.md
│       │   └── report.js                      #   branded HTML Adversary Emulation Plan (Node, no deps; ATT&CK kill chain + scorecard)
│       ├── infosec-blueteam/                 #   blue team -> Detection & Hardening Plan
│       │   ├── SKILL.md
│       │   └── report.js                      #   branded HTML Detection & Hardening Plan (Node, no deps; coverage heatmap + purple scorecard)
│       ├── infosec-incidentteam/             #   incident team -> Incident Response Report
│       │   ├── SKILL.md
│       │   └── report.js                      #   branded HTML Incident Response Report (Node, no deps; notification tracker + assumptions register)
│       ├── infosec-shared/                   #   shared, non-skill resources referenced by the team skills
│       │   └── examples/
│       │       └── um-ransomware-2019/        #   cross-skill exercise fixture (TA505/Clop), used as a regression scenario
│       │           ├── README.md              #     facilitator guide + skill mapping
│       │           ├── part-a-blue-starting-point.md   #   blue-team T0 (give to the team)
│       │           ├── part-b-red-ground-truth.md      #   red-team ground truth (release as injects)
│       │           ├── example-incident-report.md      #   reference output (Part A only)
│       │           ├── adversary-emulation.json        #   red-team report sample (node report.js --example)
│       │           ├── detection-hardening.json        #   blue-team report sample (node report.js --example)
│       │           └── incident-report.json            #   incident report sample (node report.js --example)
│       └── infosec-council/                  #   the decision council (7-seat deliberation)
│           ├── SKILL.md                       #   orchestrator (dispatches sub-agents) + skill router
│           ├── frameworks.md                  #   ← single source of truth: baselines/regime scope/versions/5x5 risk (shared by all 4 skills)
│           ├── context.md                     #   strategic house-context (fill-in template)
│           ├── journal.js                     #   decision journal (Node, no deps; default; Brier score + lookback)
│           ├── journal.sh                     #   decision journal (bash + jq; alternative)
│           ├── report.js                      #   Luméro's branded HTML report (Node, no deps; default)
│           ├── report.sh                      #   same report, bash + jq (alternative)
│           └── assets/
│               ├── lumero-logo-black.webp   #   header (light)
│               └── lumero-logo-white.webp   #   footer (dark)
├── desktop/
│   └── SKILL.md                               # ← Claude.ai/Desktop orchestrator (in-context, no sub-agents)
├── chatgpt/                                  # ← ChatGPT (custom GPT) edition
│   ├── INSTRUCTIONS.md                        #   the GPT "Instructions" field
│   ├── SETUP.md                               #   build steps + all field values
│   └── knowledge/                             #   upload these as GPT Knowledge
│       ├── council-personas.md
│       ├── frameworks.md
│       ├── context.md
│       ├── report.py                          #   Python report generator (Code Interpreter)
│       ├── CREDITS.md
│       ├── lumero-logo-black.webp
│       └── lumero-logo-white.webp
├── scripts/
│   ├── install-cli.sh                         #   copy .claude/* into ~/.claude (global CLI use)
│   ├── build-desktop-skill.sh                 #   assemble the uploadable desktop ZIP
│   ├── sync-chatgpt.js                        #   regenerate chatgpt/knowledge from canonical sources (CI-checked)
│   ├── check-versions.js                      #   guard: all three manifests agree + tag == version (CI-checked)
│   └── test-reports.js                        #   regression tests for the council + incident report generators
└── dist/                                      # build output (gitignored)
    └── infosec-council-desktop.zip
```

## Publish (maintainers)

Everything lives in one repository; no build artifacts are committed (`dist/` is
gitignored). Start private, flip to public when ready.

```bash
# 1. create the repo and push (private first)
gh repo create infosec-council --private --source=. --push

# 2. cut a release – CI builds the desktop zip and attaches it automatically,
#    which makes the one-click download link in Install work:
git tag v1.0.0 && git push origin v1.0.0

# 3. when you're ready for the world:
gh repo visibility public --repo Menno-MBA/infosec-council
```

That's it. CLI users then run `npx github:Menno-MBA/infosec-council`; Desktop users
click the download link under **Install** above. No manual zip building or
uploading; the `.github/workflows/release.yml` workflow handles it on every tag.

## Credits

Built and maintained by **Luméro** – *we do the academic research,
you get the infosec tools.* Issues, forks, and pull requests are welcome under the licenses
below. The multi-agent council architecture is adapted from
[`TorpedoD/claude-council`](https://github.com/TorpedoD/claude-council), an open-source
multi-agent decision framework (MIT-licensed): the Quick/Standard/Deep depth modes, the
anonymized peer review, the forced adversarial debate when consensus looks too clean, the
chairman synthesis that preserves a minority report, and the JSONL decision journal all
originate there. This edition specializes that framework for information security, with a
fixed panel of security domain experts, and adds the attack and detection pre-mortems.

## Security & integrity

These are zero-dependency scripts you fetch from GitHub and run locally, so two things matter:
they should not mishandle input, and you should be able to tell if the copy you ran was
altered.

- **Input is treated as untrusted.** The report generators turn a JSON object into an HTML
  dossier a human then opens and shares, so every value from that JSON is HTML-escaped, CSS
  colours are validated before they reach a `style` attribute, and numeric widths are coerced
  and clamped. There is no `eval`, no `child_process`, and no runtime dependencies.
- **Tamper-evidence.** Every executable file ships with a **SHA-256** entry in
  `scripts/integrity.sha256`. Verify a copy you fetched:

  ```bash
  npx infosec-council verify      # or, in a clone: npm run integrity
  ```

  `verify` fails loudly if any script no longer matches its recorded hash. (SHA-256, not MD5,
  which is collision-broken.) The manifest ships in-repo, so it catches accidental corruption
  and casual tampering on its own; for a hard supply-chain guarantee, pin a tag and rely on
  npm build provenance or an out-of-band hash.

See **[SECURITY.md](SECURITY.md)** for the full threat model and how to report a vulnerability.

## Contributing

Improvements are welcome: a new advisor seat, a sharper persona mandate, a `frameworks.md`
update, or a fix. Open an issue to discuss first, or send a pull request. Contributors who
help improve the council are credited here and in the release notes. By contributing you
agree your changes are licensed under the project's terms (MIT for code, CC BY-SA 4.0 for
content).

**Before you push**, run the checks (zero dependencies, `jq` optional for the bash-report
parity assertion):

```bash
npm test   # version parity, the SHA-256 integrity manifest, then the report generator tests
```

If you change any shipped script, regenerate the integrity manifest before pushing:

```bash
npm run integrity:write   # updates scripts/integrity.sha256
```

CI runs the same checks on every version tag and will not build a release if the three
manifests (`package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`)
disagree, the tag does not match the version, or a shipped script no longer matches the
integrity manifest.

### Contributors

- **Luméro** (maintainer)

## Feedback & contact

Found a bug, have an idea, or want to propose a new advisor seat or framework? Please open a
**[GitHub issue](https://github.com/Menno-MBA/infosec-council/issues)**. That keeps feedback
public, searchable, and easy to track, and it is the fastest route to a fix or a considered
feature. Prefer a direct line? Reach Menno Verheij on
**[LinkedIn](https://www.linkedin.com/in/mennoverheij)**.

## Sponsor

This council is brought to you by **[Luméro](https://lumero.nl)**, an independent
information-security consultancy based in the Netherlands. We turn academic research
into practical, right-sized security, so growing companies get enterprise-grade
thinking without the enterprise overhead. Whether it is ISO 27001, NIS2, GDPR, or a
security roadmap you can actually execute, Luméro helps you move from intent to
evidence. Ready for hands-on guidance instead of another 100-page report? Visit
**[lumero.nl](https://lumero.nl)** and let's start the conversation.

Found the council useful? The nicest way to say thanks is to **[follow Luméro on LinkedIn](https://www.linkedin.com/company/Lum%C3%A9ro)**. It costs nothing and helps a small consultancy reach more teams who need right-sized security.

## License

This project is **dual-licensed** to keep software and content cleanly separated –
Creative Commons is for the content, not the code:

| Part | Covers | License |
|---|---|---|
| **Software** | `bin/`, `scripts/`, `*.sh`, `package.json`, `.github/` | [MIT](LICENSE) |
| **Council content** | persona prompts (`.claude/agents/`), the `SKILL.md` orchestrators, `frameworks.md`, and the docs | [CC BY-SA 4.0](LICENSE-CC-BY-SA-4.0.txt) |

In short: do what you like with the **code** (MIT). If you reuse or adapt the
**council content**, you must credit *"Luméro"*, link back to this
repository, indicate your changes, and license your adaptations under **CC BY-SA 4.0**
(share-alike / copyleft).

© 2026 Luméro. The Luméro name and logos are reserved trademarks; the code and content are licensed as stated above.

### Trademark & bundled assets

The **Luméro** name and logos (`.claude/skills/infosec-council/assets/lumero-logo-*.webp`)
are trademarks of Luméro and are **not** covered by the licenses above. If you fork this
project under your own brand, replace or remove them. The HTML report uses the system
font stack (no bundled web fonts), so it renders consistently across systems with no external requests.
