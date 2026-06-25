# Luméro Information Security Council

**One decision, seven expert lenses, one synthesized verdict. Built for EU SMEs.**

[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE) [![Content: CC BY-SA 4.0](https://img.shields.io/badge/content-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-CC-BY-SA-4.0.txt) [![Install: npx](https://img.shields.io/badge/install-npx-success.svg)](#install) [![Editions: CLI + Desktop + GPT](https://img.shields.io/badge/editions-CLI%20%2B%20Desktop%20%2B%20GPT-purple.svg)](#install) [![ChatGPT GPT](https://img.shields.io/badge/ChatGPT-Try%20the%20GPT-10A37F.svg?logo=openai&logoColor=white)](https://chatgpt.com/g/g-6a3c32a5a78c8191b28254c342c1bd08-infosec-council-by-lumero) [![Website](https://img.shields.io/badge/website-lumero.nl-orange.svg)](https://lumero.nl) [![LinkedIn: Luméro](https://img.shields.io/badge/LinkedIn-Lum%C3%A9ro-0A66C2.svg?logo=linkedin&logoColor=white)](https://www.linkedin.com/company/Lum%C3%A9ro) 

> **Disclaimer - informational, not professional advice.** This council is a
> decision-support tool that role-plays security, privacy, compliance, and risk
> perspectives. Its output is **not** legal, regulatory, or professional security
> advice, may be incomplete or wrong, and is provided **with no warranty**. You
> remain responsible for your decisions. Validate anything material with a
> qualified professional. See the license files for the full warranty disclaimers.


A expert panel of seven security experts who deliberate a decision, peer-review
each other anonymously, force a debate when agreement looks too clean, and return a
synthesized verdict. Built for European **SME** reality: limited budget, limited headcount,
heavy reliance on SaaS and third parties.

It's a **persona council**, one model running as several sub-agents with
deliberately conflicting mandates. The disagreement is the product.

> Design note: the council architecture, the depth modes (Quick/Standard/Deep), the anonymized
> peer review, the forced debate when consensus looks too clean, the chairman synthesis with a
> minority report, and the decision journal, is adapted from
> [`TorpedoD/claude-council`](https://github.com/TorpedoD/claude-council), an open-source
> multi-agent decision framework. This edition fixes a panel of security *domain experts*
> (rather than general thinking lenses), so the verdict maps directly onto security, privacy,
> compliance, and risk decisions. Among other things, the attack and detection pre-mortems are its own additions.

## Install

**Claude Desktop / Claude.ai – no terminal, easiest for non-technical users.**
Download **[`infosec-council-desktop.zip`](https://github.com/Menno-MBA/infosec-council/releases/latest/download/infosec-council-desktop.zip)**
from the latest release. In the app: **Settings → Capabilities** (turn on *Code
execution & file creation* and *Skills*) → **Skills → Upload skill** → choose the
file. Then in any chat type: `ask the council: <your decision> -deep`.

**ChatGPT (custom GPT) – nothing to install, just open it.**
Use the council straight inside ChatGPT: **[Information Security Council by Luméro](https://chatgpt.com/g/g-6a3c32a5a78c8191b28254c342c1bd08-infosec-council-by-lumero)**. Type your decision and add `-deep` for the full treatment. Requires a ChatGPT account; keep *Code Interpreter* on so it can generate the branded HTML report.

**Claude Code (CLI) – one command.**

```bash
npx github:Menno-MBA/infosec-council            # install into this project
npx github:Menno-MBA/infosec-council --global   # install for every project
```

> The download zip is built automatically by CI and attached to each release;
> nothing binary is committed to the repo. Maintainers: see *Publish* below.

## The expert panel

| Member | Mandate | Anchors to |
|---|---|---|
| CISO | Posture vs. business enablement, budget, incident readiness | ISO 27001 (ISMS), NIST CSF, CIS Controls (IG1) |
| Security Architect | Secure-by-design & default; configures/hardens bought SaaS, identity-first (build) | Threat modeling (STRIDE), secure-by-design, CIS Benchmarks, zero trust |
| Offensive Security Engineer (Red Team) | Attacker's view, attack pre-mortem, exploitation chains (break) | MITRE ATT&CK; attacker's-eye view |
| Security Operations | Detection, response & recovery (run/survive); MDR + owned-tool alerts + tested IR plan | NIST CSF (detect/respond/recover), NIST incident-response guidance, MITRE ATT&CK, tested backups, GDPR breach handoff |
| Compliance Analyst | Maps mandatory EU law vs chosen attestations; evidence + crosswalks ("comply once, satisfy many") | EU regimes in scope (GDPR, NIS2, EU AI Act; DORA/CRA/PCI DSS where applicable), ISO 27001, SOC 2 |
| DPO / Privacy | Lawful, fair, transparent processing; advises & monitors (controller decides) | EU/EEA GDPR (lawful basis, ROPA, DPIA, transfers), ePrivacy, EU AI Act |
| Risk Manager | Structures & frames risk two-sidedly (owner owns, mgmt accepts); third-party risk | ISO 31000/27005 (right-sized), CIS RAM, NIST small-business guidance, cyber insurance |

The three security seats form a deliberate triad – Architect (*build* it securely),
Offensive Security (*break* it), and Security Operations (*see and survive* it failing).
That tension keeps the room from drifting into "just add another control nobody tests
or monitors." When offense and operations disagree on feasible-vs-detectable, that gap
is itself a finding.

## Depth modes

Append a depth flag (`-quick`, `-standard`, or `-deep`) to your question, or let the council pick (defaults to Standard).

| Mode | When | Members | Peer review | Debate |
|---|---|---|---|---|
| **Quick** | Low-stakes, reversible in a day | 3 most relevant | No | No |
| **Standard** | Default | All 7 | Yes | Only if consensus is suspiciously clean |
| **Deep** | High-stakes, costly to reverse | All 7 + decision-science pass | Yes | Always |

Every member ends with a **CONFIDENCE block** (confidence / assumptions / what would
change my mind / unknowns) so the verdict is calibrated, not just asserted.

## Repository structure

One repo serves both Claude Code (CLI) and Claude.ai/Desktop. Personas, scripts, and
assets have a single source of truth under `.claude/`; the desktop skill is assembled
from them by a build script.

```
infosec-council/
├── README.md
├── LICENSE                                   # MIT (the code)
├── LICENSE-CC-BY-SA-4.0.txt                  # CC BY-SA 4.0 (the council content)
├── package.json                              # npx installer metadata
├── .gitignore
├── bin/
│   └── cli.js                                # npx installer / desktop-zip builder
├── .github/
│   └── workflows/
│       └── release.yml                       # CI: builds + attaches the desktop zip on tag
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
│           ├── context.md                     #   strategic house-context (fill-in template)
│           ├── journal.sh                     #   decision journal (jq)
│           ├── report.sh                      #   Luméro's branded HTML report
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
│   └── build-desktop-skill.sh                 #   assemble the uploadable desktop ZIP
└── dist/                                      # build output (gitignored)
    └── infosec-council-desktop.zip
```

## Three ways to run it

The editions differ in one decisive way: Claude Code has real sub-agents, while Claude.ai/Desktop and the ChatGPT GPT role-play the panel in a single context. Same council, three editions, one repo.

| | Claude Code (CLI) | Claude.ai / Desktop (& Cowork) | ChatGPT (custom GPT) |
|---|---|---|---|
| Install | filesystem `.claude/` (no upload) | upload a skill ZIP in Settings | open the GPT link (nothing to install) |
| Advisors | 7 isolated sub-agents, dispatched in parallel | 7 personas role-played in **one** context | 7 personas role-played in **one** context |
| Persistent journal | yes (`~/.infosec-council/journal.jsonl`) | no – sandbox resets per session (export the HTML report instead) | no (export the HTML report) |
| HTML report | yes | yes (runs in the code-execution sandbox) | yes (via Code Interpreter) |
| Best for | the full, isolated multi-agent experience | quick access in the app, sharing via uploaded skill | anyone who lives in ChatGPT; zero setup |

### Path A – Claude Code (CLI)
Requires Claude Code v2.1+ and (for the journal/report) `jq`.

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
npx github:Menno-MBA/infosec-council#v1.5.3 --force --global
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
on. Then in any chat: `ask the council: <your decision> -deep`. (On Free/Pro/Max the
Skills upload lives under Customize → Skills; on Team/Enterprise an owner must enable
Skills org-wide first.)

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
ask the council: <your decision> -deep
```

Append `-quick`, `-standard`, or `-deep` to set the depth (default: Standard). The richer
the context (size, sector, data types, frameworks you carry, constraints), the sharper
the verdict. The council runs independent analysis, anonymized cross-examination (with
forced debate when agreement is too clean), and a chairman synthesis that ends with a
recommendation, a confidence level, a minority report, and one concrete next step.

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

The personas reference subjects **by name** and inherit the detail from here, and the
orchestrator injects `frameworks.md` into every member at deliberation time, so a single
edit (e.g. IG1 → IG2, or a PCI DSS version bump, or bringing NIS2 into scope) propagates
to all seven seats with no per-persona edits. Maintain catalog facts there; keep the
persona files for the static *traits* (mandate, method, biases, lane, output contract).

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
- See calibration: `council meta` – hit-rate by confidence level, the high-confidence
  calls that didn't pan out (the ones worth learning from), and member appearance counts.
- Recent runs: `council journal [n]`

In Claude Code you just type these in natural language ("council meta", "outcome
9615ee5e partial, the DPA had gaps") and the skill routes them to the script.

Your journal is data, not code; it lives outside the repo and is gitignored.

## HTML reports

The council turns any run into a branded, self-contained HTML dossier in the Luméro
house style (`report.sh`, bundled with the skill; needs `jq`). It lays out the
recommendation and confidence, an executive summary, the decision-science option
comparison, the key risks, where the advisors agreed and disagreed, the minority report,
and each advisor in their own words. Fonts and the Luméro logo are embedded, so it
renders identically offline with no external requests.

```bash
# from a fresh run (the council does this for you), or from the journal by sha:
bash .claude/skills/infosec-council/report.sh --sha <sha>
```

In Claude Code, just ask for "a report for <sha>".

## Roadmap

Direction is maintainer-led: Luméro curates the core council logic so every edition (CLI,
Desktop, GPT) behaves the same. The items below are under consideration, not commitments.
Suggestions are welcome (see [Contributing](#contributing)), and because the project is open
(CC BY-SA) you are free to fork and change the logic yourself.

- **Per-advisor calibration**: over time, track which advisor's dissent most often turns out
  to be right, so the council can learn whose warnings to weight more heavily. This needs the
  decision journal to record each advisor's stance per run, then compare those stances against
  the outcomes you log later.

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

## Contributing

Improvements are welcome: a new advisor seat, a sharper persona mandate, a `frameworks.md`
update, or a fix. Open an issue to discuss first, or send a pull request. Contributors who
help improve the council are credited here and in the release notes. By contributing you
agree your changes are licensed under the project's terms (MIT for code, CC BY-SA 4.0 for
content).

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
font stack (no bundl