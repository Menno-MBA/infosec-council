# Dossier JSON: the fields `report.py` reads

Read this when the user asks for a report. It is reference data, not protocol — the
deliberation rules live in the instructions, which is why they stay there and this does
not. Splitting it out is deliberate: the instruction field has a hard 8000-byte ceiling
and this list was consuming an eighth of it, so every protocol correction was being paid
for by cutting a rule somewhere else.

Build one JSON object with these keys, write it to `run.json`, then in Code Interpreter,
with `report.py` and both `lumero-logo-*.webp` in the working directory:

```python
import json, report
print(report.make_report(json.load(open("run.json"))))
```

It writes a self-contained `.html` and returns its path. Offer that file as a download.

## Always

| Key | Shape |
|---|---|
| `question` | the decision, one line |
| `subtitle` | optional detail line, keeps the title from running on |
| `mode` | `quick` / `standard` / `deep` |
| `confidence` | `low` / `medium` / `high` |
| `probability` | 0-100, the chance the recommendation survives a 12-month look-back |
| `recommendation` | the call, one line |
| `executive_summary` | 3-5 plain sentences: problem, call, why |
| `key_assumption` | the load-bearing assumption |
| `next_step` | the single most useful concrete action |
| `unverified` | array of load-bearing facts you could not verify |
| `converged` | `after-challenge` / `label-only` / `split` / `forced-debate` |
| `risks` | array, plain language, never empty |
| `consensus` | where the advisors agreed, and whether that agreement is trustworthy |
| `conflicts` | array of unresolved trade-offs |
| `blind_spots` | array of what cross-examination surfaced that Round 1 missed |
| `minority_report` | the strongest dissent worth preserving |
| `ranking` | array of `{position, score, note}` from the peer scoring |

## Risk rating

`risk_score` is `{inherent: {...}, residual: {...}}`, each with `impact`, `likelihood`
and `rationale`, on the 5x5 scale in `frameworks.md`:

- `impact`: `negligible` / `minor` / `moderate` / `major` / `severe`
- `likelihood`: `rare` / `unlikely` / `possible` / `likely` / `almost certain`

An **already-observed** impact is `almost certain`, never `possible`. The gap between
inherent and residual is the visible value of the recommendation, so an honest residual
that stays level with inherent is a real answer, not a failure to fill the field.

## Obligations

`obligations` is `{triggered: [...], ruled_out: [...]}` from the determination pass:

- `triggered`: `{label, action, determination, execution, clock, recipient, ref}`
- `ruled_out`: `{label, reason}` — the explicit-negative ledger of what was assessed and
  why it did not apply. Most rows land here for a general SME, and that is the correct,
  auditable default rather than an empty section.

## Advisors

`members` is an array of
`{name, stance, condition, confidence, probability, summary, assumptions, change_my_mind}`.

- `name` is the persona key from `council-personas.md` (`ciso`, `security-architect`,
  `offensive-security`, `security-operations`, `compliance-analyst`, `dpo`,
  `risk-manager`). A key outside that set renders with no role description rather than
  an error, so it fails quietly — use the exact key.
- `condition` is what a conditional stance actually requires. Omit it for a plain
  `go` or `no-go`. It is what makes a `label-only` outcome inspectable: without it a
  reader can see that the panel agreed on a verdict and not on what it demanded, but
  not on what each advisor demanded.

## Deep runs only

| Key | Shape |
|---|---|
| `options` | array of `{option, effort, risk_reduction, cost, reversibility, verdict}` |
| `risk_appetite` | the owner risk-appetite check |
| `highest_leverage` | the highest-leverage move |
