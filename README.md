# Luméro Information Security Council

**Get a second opinion on a hard security decision, from seven experts instead of one.**

[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE.md)
[![Content: CC BY-SA 4.0](https://img.shields.io/badge/content-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE-CC-BY-SA-4.0.txt)
[![Editions: CLI + Desktop + GPT](https://img.shields.io/badge/editions-CLI%20%2B%20Desktop%20%2B%20GPT-purple.svg)](docs/getting-started.md)
[![ChatGPT GPT](https://img.shields.io/badge/ChatGPT-Try%20the%20GPT-10A37F.svg?logo=openai&logoColor=white)](https://chatgpt.com/g/g-6a3c32a5a78c8191b28254c342c1bd08-infosec-council-by-lumero)
[![Ask DeepWiki](https://img.shields.io/badge/DeepWiki-ask%20the%20codebase-8A2BE2.svg)](https://deepwiki.com/Menno-MBA/infosec-council)
[![Website](https://img.shields.io/badge/website-lumero.nl-orange.svg)](https://lumero.nl)
[![LinkedIn: Luméro](https://img.shields.io/badge/LinkedIn-Lum%C3%A9ro-0A66C2.svg?logo=linkedin&logoColor=white)](https://www.linkedin.com/company/Lum%C3%A9ro)

You describe a decision. Seven security advisors each think about it separately: a CISO, an
architect, a hacker, an operations lead, a compliance analyst, a privacy officer and a risk
manager. Then they challenge each other without knowing who said what. You get back one clear
recommendation, the disagreements that survived, and the one thing to do next.

It is built for **European small and mid-sized companies**: limited budget, no big security
team, a lot of things running on other people's servers.

> ### Please read this first
>
> This is a **decision-support tool**, not professional advice. It role-plays security,
> privacy, compliance and risk perspectives. Its output is **not** legal, regulatory or
> professional security advice, may be incomplete or wrong, and comes **with no warranty**.
> You remain responsible for your decisions. Validate anything material with a qualified
> professional. It is a point-in-time read, not monitoring; re-run it when the decision, the
> facts or the rules change.

---

## What you get

**A verdict you can act on.** A recommendation, a confidence level, the key risks in plain
language, and one concrete next step. Plus a *minority report*: the strongest objection, kept
in even when it lost the argument.

**The legal clocks, surfaced automatically.** Before it starts arguing, the council checks
every registered statutory duty, such as a GDPR breach notification or a NIS2 report, and
returns each one as *this applies, here is who owns it and by when* or *this does not apply, here is why*.
That second half is the useful one: it is a written record of what was considered and ruled
out.

**A track record.** Every run is logged. Months later you tell it how the decision actually
went, and it scores itself, including how often nobody got round to doing what it recommended.
Over time you find out whether its confidence is worth anything. A one-shot answer can never
tell you that.

**A report you can send to someone.** One self-contained HTML file, branded, that opens
offline and needs nothing installed.

## Beyond deciding

Three more skills do the operational work and escalate the hard calls back to the council:

| | What it does | You get |
|---|---|---|
| 🔴 **Red team** | Plans an authorized attack simulation | Adversary Emulation Plan |
| 🔵 **Blue team** | Builds detection and hardening against it | Detection & Hardening Plan |
| 🚨 **Incident team** | Runs a live response | Incident Response Report |

They compose as a lifecycle. → [More about the team skills](docs/team-skills.md)

---

## Try it

**In ChatGPT, nothing to install.** Open
**[Information Security Council by Luméro](https://chatgpt.com/g/g-6a3c32a5a78c8191b28254c342c1bd08-infosec-council-by-lumero)**
and type your decision.

**In Claude Desktop, no terminal.** Download
**[`infosec-council-desktop.zip`](https://github.com/Menno-MBA/infosec-council/releases/latest/download/infosec-council-desktop.zip)**,
then in the app: **Settings → Capabilities** (turn on *Code execution & file creation* and
*Skills*) → **Skills → Upload skill**.

**In Claude Code, one command.**

```bash
npx github:Menno-MBA/infosec-council            # this project
npx github:Menno-MBA/infosec-council --global   # every project
```

→ [Full installation guide](docs/getting-started.md), including the plugin, model choices and
how to update.

---

## Ask it something

Type this in any of the three editions:

```
ask the infosec-council: we want to let the team use a new AI note-taker that joins our
customer calls and stores transcripts. ~25 staff, B2B SaaS, SOC 2 in progress. Should we,
and under what conditions? -deep
```

**It handles live trouble too, not just plans:**

```
ask the infosec-council: a phishing email led to a compromised Microsoft 365 account with
new mailbox forwarding rules. What is the blast radius, the response, and our GDPR and NIS2
notification duties? -deep
```

The more you tell it, the sharper the answer: your size, your sector, what data you hold, what
rules you fall under, what constrains you.

### How much thinking do you want?

Add one of these to the end of your question. The default is Standard.

| Flag | Use it when | What happens |
|---|---|---|
| `-quick` | Low stakes, easy to undo | 3 advisors, fast |
| `-standard` | Most of the time | All 7, peer review, debate if they agree too easily |
| `-deep` | Expensive to get wrong | All 7, always debates, options compared, output audited |

→ [How it works](docs/how-it-works.md): the panel, the protocol, and how the room converges.

---

## Documentation

| | |
|---|---|
| **[Getting started](docs/getting-started.md)** | Install it, all three editions |
| **[How it works](docs/how-it-works.md)** | The panel, depth modes, convergence, grounding |
| **[The team skills](docs/team-skills.md)** | Red, blue and incident |
| **[Configuration](docs/configuration.md)** | Tune it to your organization |
| **[Reports and the journal](docs/reports-and-journal.md)** | Dossiers and calibration |
| **[Repository structure](docs/repository-structure.md)** | Find your way around |
| **[Roadmap](docs/roadmap.md)** | Where it is going |
| **[Changelog](CHANGELOG.md)** | What changed, and why |

Want to ask questions about the code? There is an AI-generated walkthrough at
**[DeepWiki](https://deepwiki.com/Menno-MBA/infosec-council)**.

---

## Make it yours

Three files hold everything tunable, and an upgrade never overwrites them:

- **`frameworks.md`** holds which rules apply to you, which security baseline you hold yourself to,
  and the statutory duties the council checks before every run.
- **`context.md`** holds your house positions: what you have already decided, what is out of
  appetite regardless of the business case.
- **`external-websources.md`** says where the council goes to check a fact rather than remembering
  one.

→ [Configuration guide](docs/configuration.md)

---

## Security

These are zero-dependency scripts you fetch from GitHub and run locally, so two things matter:
they should not mishandle input, and you should be able to tell whether the copy you ran was
altered.

Every value that reaches a report is escaped; there is no `eval`, no `child_process` and no
runtime dependencies. Every executable ships with a SHA-256 entry you can check:

```bash
npx infosec-council verify
```

→ **[SECURITY.md](SECURITY.md)** for the threat model and how to report a vulnerability.

---

## Credits and license

Built and maintained by **[Luméro](https://lumero.nl)**. *We do the academic research, you get
the infosec tools.*

The multi-agent council architecture is adapted from
[`TorpedoD/claude-council`](https://github.com/TorpedoD/claude-council), an open-source
multi-agent decision framework. The depth modes, anonymized peer review, forced debate, the
chairman synthesis with its minority report, and the decision journal all originate there. This
edition specializes that framework for information security, with a fixed panel of domain
experts, and adds the attack and detection pre-mortems.

**Dual-licensed**, because Creative Commons is for content, not code:

| Part | License |
|---|---|
| **Software**: `bin/`, `scripts/`, `.github/`, `package.json`, every `*.sh`, and the shipped executables (`report.js`, `journal.js`, `report.py`) | [MIT](LICENSE.md) |
| **Council content**: persona prompts, the `SKILL.md` orchestrators, the configuration registers, the exercise fixtures, and the docs | [CC BY-SA 4.0](LICENSE-CC-BY-SA-4.0.txt) |

In short: do what you like with the code. If you reuse or adapt the council content, credit
*"Luméro"*, link back here, say what you changed, and share alike.

The **Luméro** name and logos are reserved trademarks and are **not** covered by those
licenses. If you fork this under your own brand, replace or remove them.

© 2026 Luméro.

---

## Get in touch

Found a bug, or want to propose a new advisor seat? Please open a
**[GitHub issue](https://github.com/Menno-MBA/infosec-council/issues)**. It keeps feedback
public and searchable, and it is the fastest route to a fix. Want to contribute? See
**[CONTRIBUTING.md](CONTRIBUTING.md)**. Prefer a direct line? Reach Menno Verheij on
**[LinkedIn](https://www.linkedin.com/in/mennoverheij)**.

Luméro is an independent information-security consultancy in the Netherlands. We turn academic
research into practical, right-sized security, so growing companies get enterprise-grade
thinking without the enterprise overhead. Ready for hands-on guidance instead of another
100-page report? Visit **[lumero.nl](https://lumero.nl)**.

Found the council useful? The nicest way to say thanks is to
**[follow Luméro on LinkedIn](https://www.linkedin.com/company/Lum%C3%A9ro)**.
