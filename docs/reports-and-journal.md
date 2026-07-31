# Reports and the decision journal

Two things outlive a single run: the **dossier** you can send to someone, and the **journal**
that tells you, months later, whether the advice was any good.

---

## Branded HTML dossiers

Every skill turns its work into a self-contained HTML dossier in the Luméro house style. All
four generators share one brand shell: the same palette, typography, tables, 5x5 risk-exposure
bar, status pills and TLP marking. A reader who has seen one report reads all of them the same
way.

Each is a zero-dependency Node `report.js` that reads a JSON object on stdin (or `--in <file>`),
base64-embeds the logo, and writes one portable `.html` file that renders identically offline
with no external requests.

| Skill | Dossier | Signature sections |
|---|---|---|
| **infosec-council** | Security Decision Dossier | recommendation + confidence, executive summary, 5x5 risk bar, regulatory-obligations ledger, decision-science options, agree/disagree, minority report, each advisor with its condition |
| **infosec-redteam** | Adversary Emulation Plan | exec + scorecard tiles, scope/RoE, emulated adversary, ATT&CK kill-chain table, blue-team detection scorecard, findings, safety attestation |
| **infosec-blueteam** | Detection & Hardening Plan | coverage tiles, TTP scope, log-source coverage map, ATT&CK coverage heatmap, detection-rule table, hunt cards, ranked hardening backlog, purple-team scorecard |
| **infosec-incidentteam** | Incident Response Report | severity banner, notification tracker with live deadline countdowns, breach register, timeline, containment dial, evidence register, decision log, eradication gates, comms log |

In Claude Code, just ask for "a report" after any run, or "a report for `<sha>`" for the
council. To run a generator directly:

```bash
# council, from the journal by sha
node .claude/skills/infosec-council/report.js --sha <sha>

# a team skill, from a JSON deliverable or the bundled sample
node .claude/skills/infosec-redteam/report.js      < plan.json
node .claude/skills/infosec-blueteam/report.js     --example
node .claude/skills/infosec-incidentteam/report.js < incident.json
```

The council additionally ships `report.sh` (bash + `jq`) as an alternative to its Node
generator. The ChatGPT edition uses `report.py` in Code Interpreter. All three produce
identical output, and CI asserts that.

---

## The decision journal

The council logs each run and lets you record how the decision actually turned out, so you can
see over time whether your high-confidence calls are trustworthy.

Two interchangeable scripts ship with the skill: `journal.js` (Node, zero dependencies, the
default, and the one that works on Windows and inside the Desktop sandbox) and `journal.sh`
(bash, needs `jq`). You do not need `jq` if you have Node.

> `journal.sh` implements log, outcome, meta, journal, lookback and path. `pending`, `grade`,
> the ECE and the round-2 statistics are `journal.js` only. It says so rather than failing
> quietly.

Your journal is **data, not code**. It lives outside the repo and is gitignored.

### Where it lives

Every run is appended to `~/.infosec-council/journal.jsonl`. Override the location with
`COUNCIL_HOME`; set `COUNCIL_ORG` to keep one client's journal and house-context out of
another's.

The council tells you each run's `sha`. It also stores a `family` id, but that is a hash of the
verbatim question, so it only matches a rerun asked in identical words. `lookback` is what
actually finds a comparable past decision.

### Commands

In Claude Code you type these in natural language ("council meta", "outcome 9615ee5e partial,
the DPA had gaps") and the skill routes them to the script.

| Command | What it does |
|---|---|
| `council outcome <sha> <result> "note"` | Record how it turned out |
| `council pending` | Runs old enough to have a result but still ungraded |
| `council grade` | The same runs, as ready-to-paste `outcome` commands |
| `council meta` | Calibration: Brier, ECE, reliability curve, delivery rate, high-confidence misses |
| `council journal [n]` | The last n runs |
| `council lookback "<the decision>"` | Comparable past runs |

### The four outcomes

| Outcome | Meaning |
|---|---|
| `correct` | The advice held up. |
| `partial` | Broadly right, but it missed something material or only half worked. |
| `wrong` | The advice did not hold. |
| `not-tested` | **Nobody executed it, so it was never put to the test.** |

`not-tested` is the most common real outcome and the one people otherwise stay silent about,
because the other three do not fit. It records a **delivery gap**, not a wrong call, and it is
deliberately kept out of the calibration maths. A high not-tested count is an execution
problem in the organisation, not an accuracy problem in the panel, and the two must not be read
off the same number.

### Actually grading them

Knowing the count was never what stopped anyone; composing the command was. `council grade`
prints each ungraded run with its question, the call, the assumption it rested on, and a
ready-to-paste command.

A run against a documented example case can be graded **now**, against that case's published
ground truth. Start the note with `exercise:` so the record shows it. Those grades share one
pool with live decisions, so the Brier score mixes "we were right about a documented past
event" with "our advice held up in practice". The prefix keeps that visible where the maths
does not separate it.

### What calibration tells you

`council meta` reports a **Brier score** and an **Expected Calibration Error** with a
reliability curve. Brier scores accuracy and calibration together; ECE isolates calibration,
meaning whether the panel's 70%-confidence calls actually come right about 70% of the time. It also
surfaces the high-confidence calls that did not pan out, which are the ones worth learning
from.

Beside those sits the **delivery rate**: how often a recommendation was actually executed,
which is a governance metric rather than an accuracy one.

The chairman states the measured reliability beside the asserted one in every synthesis, and
says plainly when too few outcomes are graded to claim anything.

### Whether the cross-examination earns its cost

Round 2 is the protocol's most expensive round. Each run now records every seat's stance and
probability *before* the cross-examination as well as after, plus which blind spots first
surfaced there. `meta` aggregates that into a `round2_value` block.

Below five runs carrying the data it reports the count and why it cannot say, rather than a
mean that would read as a finding. This is a measurement in progress, not a settled answer.
