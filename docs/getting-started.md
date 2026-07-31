# Getting started

Three editions, one repo. Pick the row that matches how you work.

| | Claude Code (CLI) | Claude.ai / Desktop (& Cowork) | ChatGPT (custom GPT) |
|---|---|---|---|
| Install | filesystem `.claude/` (no upload) | upload a skill ZIP in Settings | open the GPT link (nothing to install) |
| Advisors | 7 isolated sub-agents, dispatched in parallel | 7 personas role-played in **one** context | 7 personas role-played in **one** context |
| Team skills (red/blue/incident) | yes | council only | council only |
| Persistent journal | yes (`~/.infosec-council/journal.jsonl`) | no — sandbox resets per session | no |
| HTML report | yes | yes (code-execution sandbox) | yes (Code Interpreter) |
| Grounding / retrieval | register-backed retrieval pass | register-backed retrieval pass | volatile-fact rule only; the register does not ship here |
| Best for | the full, isolated multi-agent experience | quick access in the app | anyone who lives in ChatGPT; zero setup |

The editions differ in one decisive way: Claude Code has real sub-agents, while
Claude.ai/Desktop and the ChatGPT GPT role-play the panel in a single context.

---

## Claude Desktop / Claude.ai

No terminal. Easiest if you are not technical.

Download **[`infosec-council-desktop.zip`](https://github.com/Menno-MBA/infosec-council/releases/latest/download/infosec-council-desktop.zip)**
from the latest release. Then in the app:

1. **Settings → Capabilities** — turn on *Code execution & file creation* and *Skills*.
2. **Customize → Skills** (Team/Enterprise: *Settings → Skills* first) → **+ Create skill /
   Upload skill** → choose the file.
3. Toggle it on.

Then in any chat: `ask the infosec-council: <your decision> -deep`.

On Free/Pro/Max the Skills upload lives under **Customize → Skills**; on Team/Enterprise an
owner must enable Skills org-wide first.

**Building the ZIP yourself** (instead of downloading it):

```bash
bash scripts/build-desktop-skill.sh              # writes dist/infosec-council-desktop.zip
npx github:Menno-MBA/infosec-council build-desktop   # cross-platform, no bash/zip needed
```

---

## ChatGPT

Nothing to install. Open **[Information Security Council by
Luméro](https://chatgpt.com/g/g-6a3c32a5a78c8191b28254c342c1bd08-infosec-council-by-lumero)**,
type your decision, add `-deep` for the full treatment.

Requires a ChatGPT account. Keep *Code Interpreter* on so it can generate the HTML report.

Building your own GPT from this repo: see [`chatgpt/SETUP.md`](../chatgpt/SETUP.md).

---

## Claude Code (CLI)

Requires Claude Code v2.1+. The HTML report needs only Node; `jq` is optional (for the bash
variants of the report and journal scripts).

**Fastest — install with npx**, no clone:

```bash
npx github:Menno-MBA/infosec-council            # install into ./.claude (this project)
npx github:Menno-MBA/infosec-council --global   # install into ~/.claude (every project)
```

Add `--force` to overwrite an existing install.

**Or clone and run** — agents and skills are auto-detected at project scope:

```bash
git clone https://github.com/Menno-MBA/infosec-council.git
cd infosec-council
claude
```

To make it available in every project without npx:

```bash
bash scripts/install-cli.sh   # copies agents → ~/.claude/agents, skills → ~/.claude/skills
```

### Recommended models (cost vs quality)

Run Claude Code itself on **Opus** — it does the framing and the final synthesis — while the
seven advisors run as sub-agents on **Sonnet** (set with `model: sonnet` in each persona file).
Opus for everything works but burns far more tokens. To force the advisors onto Sonnet
regardless of your session model:

```bash
export CLAUDE_CODE_SUBAGENT_MODEL=sonnet
```

### Updating

**npx does not auto-update.** It keeps the version you first installed. To upgrade, re-run the
install with `--force` and the latest release tag — the tag also avoids a stale download cache:

```bash
npx github:Menno-MBA/infosec-council#v2.2.0 --force --global
```

Use the newest tag from the
[Releases](https://github.com/Menno-MBA/infosec-council/releases) page. The installer prints
the version it set; check yours anytime with:

```bash
npx github:Menno-MBA/infosec-council --version
```

Then close and reopen Claude Code so it loads the new version. Still seeing the old text? An
older copy in your home folder is being used — the `--global` re-install above overwrites it.

An upgrade never overwrites your tuned `context.md` or `frameworks.md`.

---

## Claude Code plugin (also runs in Cowork)

The full suite as a versioned plugin — the council plus the red, blue and incident team skills.

```
/plugin marketplace add Menno-MBA/infosec-council
/plugin install infosec-council@lumero
```

It runs in the terminal and in Cowork on the desktop app, where it dispatches real sub-agents
rather than role-playing them in one context like the uploadable skill does. Updates arrive
through `/plugin update` when a new version ships.

---

## A note on the download

The ZIPs are built by CI and attached to each release; nothing binary is committed to the repo.
Release process: see [CONTRIBUTING.md](../CONTRIBUTING.md).
