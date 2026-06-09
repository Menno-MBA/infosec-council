# Information Security Council

A Claude Code council of six security experts who deliberate a decision, peer-review
each other anonymously, force a debate when agreement looks too clean, and return a
synthesized verdict. Built for **SMB** reality: limited budget, limited headcount,
heavy reliance on SaaS and third parties.

It's a **persona council** — one model running as several sub-agents with
deliberately conflicting mandates. The disagreement is the product.

> Design note: some councils (e.g. TorpedoD/claude-council) use *cognitive lenses*
> (Red Team, First Principles, Outsider...) that apply to any decision. This one uses
> *domain experts*, which give more directly usable answers to security/privacy/risk
> questions. We borrow the pre-mortem technique from their Red Team lens, but apply it
> to detection (the Security Operations seat) rather than to offense.

## Members

| Member | Mandate | Anchors to |
|---|---|---|
| CISO | Posture vs. business enablement, budget, incident readiness | ISO 27001 ISMS, NIST CSF, SOC 2 |
| Security Architect | Secure-by-design & default; configures/hardens bought SaaS, identity-first (build) | Threat Modeling Manifesto + STRIDE/LINDDUN, cloud shared-responsibility, CIS Benchmarks/SCuBA, zero trust, CIS IG1 |
| Offensive Security Engineer (Red Team) | Attacker's view, attack pre-mortem, exploitation chains (break) | MITRE ATT&CK, kill chain, attacker ROI |
| Security Operations | Detection, response & recovery (run/survive); MDR + owned-tool alerts + tested IR plan | NIST CSF 2.0 DE/RS/RC, SP 800-61r3, MITRE ATT&CK, CIS Control 8, 3-2-1-1-0 backups, GDPR breach handoff to DPO |
| Compliance Analyst | Maps mandatory EU law vs chosen attestations; evidence + crosswalks ("comply once, satisfy many") | GDPR, NIS2/Cbw, DORA, EU AI Act, CRA (where in scope); ISO 27001:2022, SOC 2 (customer-driven), PCI DSS v4.0.1 |
| DPO / Privacy | Lawful, fair, transparent processing; advises & monitors (controller decides) | EU/EEA + UK GDPR (Arts. 5,6,9,25,30,35-36,33-34,44-49), ROPA, DPIA, transfers (SCC/TIA/DPF), ePrivacy |
| Risk Manager | Structures & frames risk two-sidedly (owner owns, mgmt accepts); third-party risk | ISO 31000/27005 right-sized, CIS RAM/IG1, NIST IR 7621; 4 treatment options incl. cyber insurance; appetite vs attitude |

The three security seats form a deliberate triad — Architect (*build* it securely),
Offensive Security (*break* it), and Security Operations (*see and survive* it failing).
That tension keeps the room from drifting into "just add another control nobody tests
or monitors." When offense and operations disagree on feasible-vs-detectable, that gap
is itself a finding.

## Depth modes

Append the mode to your question, or let the council pick (defaults to Standard).

| Mode | When | Members | Peer review | Debate |
|---|---|---|---|---|
| **Quick** | Low-stakes, reversible in a day | 3 most relevant | No | No |
| **Standard** | Default | All 6 | Yes | Only if consensus is suspiciously clean |
| **Deep** | High-stakes, costly to reverse | All 6 + decision-science pass | Yes | Always |

Every member ends with a **CONFIDENCE block** (confidence / assumptions / what would
change my mind / unknowns) so the verdict is calibrated, not just asserted.

## Repository structure

One repo serves both Claude Code (CLI) and Claude.ai/Desktop. Personas, scripts, and
assets have a single source of truth under `.claude/`; the desktop skill is assembled
from them by a build script.

```
infosec-council/
├── README.md
├── LICENSE
├── .gitignore
├── .claude/                                  # ← Claude Code (CLI) reads this directly
│   ├── agents/                               #   one sub-agent per advisor (CLI only)
│   │   ├── ciso.md
│   │   ├── security-architect.md
│   │   ├── offensive-security.md
│   │   ├── security-operations.md
│   │   ├── compliance-analyst.md
│   │   ├── dpo.md
│   │   └── risk-manager.md
│   └── skills/
│       └── infosec-council/
│           ├── SKILL.md                       #   orchestrator (dispatches sub-agents)
│           ├── frameworks.md                  #   ← single source of truth: baselines/regime scope/versions + cross-ref table
│           ├── journal.sh                     #   decision journal (jq)
│           ├── report.sh                      #   branded HTML report
│           └── assets/
│               ├── lumero-logo-white.png
│               └── fonts-embedded.css
├── desktop/
│   └── SKILL.md                               # ← Claude.ai/Desktop orchestrator (in-context, no sub-agents)
├── scripts/
│   ├── install-cli.sh                         #   copy .claude/* into ~/.claude (global CLI use)
│   └── build-desktop-skill.sh                 #   assemble the uploadable desktop ZIP
└── dist/                                      # build output (gitignored)
    └── infosec-council-desktop.zip
```

## Two ways to run it

The two products differ in one decisive way — **Claude Code has sub-agents; Claude.ai/
Desktop does not** — so the council ships in two editions from the same repo.

| | Claude Code (CLI) | Claude.ai / Desktop (& Cowork) |
|---|---|---|
| Install | filesystem `.claude/` (no upload) | upload a skill ZIP in Settings |
| Advisors | 7 isolated sub-agents, dispatched in parallel | 7 personas role-played in **one** context |
| Persistent journal | yes (`~/.infosec-council/journal.jsonl`) | no — sandbox resets per session (export the HTML report instead) |
| HTML report | yes | yes (runs in the code-execution sandbox) |
| Best for | the full, isolated multi-agent experience | quick access in the app, sharing via uploaded skill |

### Path A — Claude Code (CLI)
Requires Claude Code v2.1+ and (for the journal/report) `jq`.

**Fastest — install with npx** (no clone; runs straight from this repo):

```bash
npx github:<you>/infosec-council            # install into ./.claude (this project)
npx github:<you>/infosec-council --global   # install into ~/.claude (every project)
```

Add `--force` to overwrite an existing install. Once published to npm, plain
`npx infosec-council` works too.

**Or clone and run** (agents + skill are auto-detected at project scope):

```bash
git clone https://github.com/<you>/infosec-council.git
cd infosec-council
claude                       # run from the repo → agents + skill are auto-detected (project scope)
```

To make it available in **every** project without npx, install globally (or
`npx github:<you>/infosec-council --global`):

```bash
bash scripts/install-cli.sh  # copies agents → ~/.claude/agents, skill → ~/.claude/skills
```

### Path B — Claude.ai / Desktop / Cowork
Build the uploadable skill, then add it in the app.

```bash
bash scripts/build-desktop-skill.sh   # writes dist/infosec-council-desktop.zip
# or, cross-platform (no bash/zip needed):
npx github:<you>/infosec-council build-desktop
```

In the app: **Settings → Capabilities**, turn on *Code execution and file creation* and
*Skills*; then **Customize → Skills** (Team/Enterprise: *Settings → Skills* first) →
**+ Create skill / Upload skill** → choose `dist/infosec-council-desktop.zip`. Toggle it
on. Then in any chat: `convene the council: <your decision> deep`. (On Free/Pro/Max the
Skills upload lives under Customize → Skills; on Team/Enterprise an owner must enable
Skills org-wide first.)

## Use

```
convene the council: we want to let the team use a new AI note-taker that joins
our customer calls and stores transcripts. ~25 staff, B2B SaaS, SOC 2 in progress.
Should we, and under what conditions? deep
```

The richer the context (size, sector, data types, frameworks you carry, constraints),
the sharper the verdict. The council runs independent analysis, anonymized
cross-examination (with forced debate when agreement is too clean), and a chairman
synthesis that ends with a recommendation, a confidence level, a minority report,
and one concrete next step.

## Frameworks & baselines (one place to maintain)

All regulations, standards, guidelines, and technologies live in
`.claude/skills/infosec-council/frameworks.md` — not scattered across the personas. It has:

- **Part A — configuration knobs** you flip once: the **control baseline** (currently
  `CIS Controls IG1` → change to `IG2`/`IG3` to re-level the whole council), jurisdiction,
  backup standard, MFA standard, default risk posture, quantification depth.
- **In-scope regimes** toggle: GDPR, ePrivacy, NIS2/Cbw, DORA, EU AI Act, CRA, PCI DSS,
  SOC 2 — flip a regime to "in scope" and the relevant seats treat it as live.
- **Part B — reference register**: every subject with its canonical version/level and a
  **cross-reference column** showing which personas cite it.

The personas reference subjects **by name** and inherit the detail from here, and the
orchestrator injects `frameworks.md` into every member at deliberation time — so a single
edit (e.g. IG1 → IG2, or a PCI DSS version bump, or bringing NIS2 into scope) propagates
to all seven seats with no per-persona edits. Maintain catalog facts there; keep the
persona files for the static *traits* (mandate, method, biases, lane, output contract).

## Customize

- **Add a member**: drop `.claude/agents/<role>.md` and add it to the member list in
  the SKILL.md. Candidates: Threat-Intel, IR/Forensics, Identity & Access specialist.
- **Re-tune biases**: the council's value depends on members genuinely disagreeing.
  If two members always agree, sharpen their conflicting mandates.
- **Swap regulatory anchors** to your jurisdiction/sector (e.g. HIPAA, DORA, FedRAMP).

## Decision journal

The council logs each run and lets you record how the decision actually turned out,
so you can see over time whether your high-confidence calls are trustworthy. It's a
single script (`journal.sh`, bundled with the skill) and needs only `jq`.

```bash
# Install jq if you don't have it
brew install jq        # macOS
sudo apt-get install jq  # Linux
```

- Every council run is appended automatically to `~/.infosec-council/journal.jsonl`
  (override the location with `COUNCIL_HOME`). The council tells you each run's `sha`.
- Record the outcome later, once the decision plays out:
  `council outcome <sha> correct|partial|wrong "short note"`
- See calibration: `council meta` — hit-rate by confidence level, the high-confidence
  calls that didn't pan out (the ones worth learning from), and member appearance counts.
- Recent runs: `council journal [n]`

In Claude Code you just type these in natural language ("council meta", "outcome
9615ee5e partial, the DPA had gaps") and the skill routes them to the script.

Your journal is data, not code — it lives outside the repo and is gitignored.

## HTML reports

Generate a branded, self-contained HTML dossier for any run (`report.sh`, bundled
with the skill; needs `jq`). It renders the recommendation with a confidence badge,
advisor cards, the live conflicts / blind spots / minority report, and a footer.

```bash
# from a fresh run (the council does this for you), or from the journal by sha:
bash .claude/skills/infosec-council/report.sh --sha <sha>
```

Branding: the Luméro logo ships with the skill (`assets/lumero-logo-white.png`) and is
embedded automatically on a dark footer band. Override it by setting `LUMERO_LOGO` to a
URL or a different local image path; if neither is found, a "Luméro" wordmark is used. Override the strapline with `LUMERO_TAGLINE` (default: *We do the academic
research, you get the tools.*). In Claude Code, just ask for "a report for <sha>". 

The report is fully self-contained: fonts (Fraunces + IBM Plex) are base64-embedded from `assets/fonts-embedded.css`, so it renders identically offline with no external requests. If that asset is removed, it falls back to loading the fonts from Google Fonts.

## Roadmap ideas

- **Per-member calibration**: attribute outcomes to individual members' stances to
  learn which advisor's dissent best predicts a bad outcome (needs richer stance logging).

## Publish to GitHub (one repo, both editions)

Everything above lives in a single repository. From the repo root:

```bash
git init && git add -A && git commit -m "infosec council: CLI + desktop editions"
gh repo create infosec-council --public --source=. --push
```

Anyone can then use it either way: clone and run `claude` (Path A), or run
`bash scripts/build-desktop-skill.sh` and upload the ZIP (Path B). `dist/` is
gitignored, so the build artifact isn't committed — it's regenerated from source. If
you'd rather ship a ready-made ZIP for non-technical users, attach
`infosec-council-desktop.zip` to a GitHub Release instead of committing it.

## License

MIT — do what you want.
