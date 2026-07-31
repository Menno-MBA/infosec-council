# Roadmap

Direction is maintainer-led: Luméro curates the core council logic so every edition (CLI,
Desktop, GPT) behaves the same. The items below are under consideration, **not commitments**.

Suggestions are welcome, see [CONTRIBUTING.md](../CONTRIBUTING.md). Because the project is
open (CC BY-SA) you are also free to fork and change the logic yourself.

Full detail for every release is in [CHANGELOG.md](../CHANGELOG.md).

---

## Under consideration

**Per-advisor calibration.** Track which advisor's dissent most often turns out to be right, so
the council can learn whose warnings to weight more heavily. The prerequisite, recording each
advisor's stance per run, has existed since v1.6.0; what remains is comparing those stances
against the outcomes you log later.

**Does the cross-examination earn its cost?** As of v2.2.0 each run records every seat's
position before and after Round 2. Once enough runs carry that data, the question becomes
answerable from evidence rather than argument. Whatever the answer, it should change the
protocol rather than sit in a report.

**A structural answer for the ChatGPT edition's size ceiling.** Its instruction field has a hard
8000-byte limit and sits close to it. v2.2.0 moved the dossier field list into a knowledge file
to buy room; the next protocol change may need more of the same, because a clause cut to fit is
a rule cut to fit.

---

## Recently shipped

**v2.2.0, the deliberation mechanism gets measured.** Convergence stops being a stance count:
it now needs agreeing conditions and a bounded probability spread, with a fourth `label-only`
outcome for a panel that shares a verdict word without sharing what it demands. Round 2 is
instrumented so its value becomes measurable. `journal grade` turns the pending count into
paste-ready commands, because knowing the count was never what stopped anyone. Several guards
that could go green while the thing they guarded was broken were repaired, each reproduced
before it was fixed. CER/Wwke joins the regulatory register as a designation-gated regime.

**v2.1.0, the suite stops answering from memory alone.** A curated register,
`external-websources.md`, says *where* to verify a fact, and all four skills run a retrieval
pass against it, scaled by depth mode (Quick retrieves nothing and says so). The motivating
defect was real: ATT&CK was catalogued as "current" while v19 had retired the Defense Evasion
tactic, so runs were emitting a tactic that no longer exists. Retrieval carries a trust
boundary in both directions: retrieved content is data and never instruction, queries carry no
client names or indicators, and a URL taken from case material is never fetched. The
calibration loop closed with a `not-tested` outcome, a delivery-rate metric and a pending
ledger the council reports every run.

**v2.0.0, parity and hardening.** All three team skills gained branded HTML dossiers sharing
one brand shell with the council. The mechanism gained state-of-the-art bias controls (rotated,
length-normalized anonymized peer scoring, to blunt the order and verbosity biases an LLM judge
falls for) and a richer calibration read (ECE and a reliability curve beside the Brier score).
The codebase was security-hardened: input JSON escaped by default, a SHA-256 integrity manifest
with a `verify` command, and a documented threat model in [SECURITY.md](../SECURITY.md).

**v1.8.x, the observed-vs-assumed guardrail.** When an incident commander fills a gap under
pressure, that inference is tagged as assumed with a named verifier, collected in an
assumptions register, and blocked by a synthesis gate from hardening into the record as fact. Ships with a
cross-skill exercise fixture (TA505/Clop) that doubles as a regression scenario.

**v1.7.x, the conditional-obligation layer and the 5x5 risk matrix.** `frameworks.md` gained
an obligation registry; the council runs a determination pass before deliberating, with each
statutory duty returned as triggered or explicitly ruled out on the record. Gate B blocks the
synthesis while a triggered obligation lacks an owner and a clock. Three operational team skills
joined, with seats grounded in the ENISA ECSF role profiles.

**v1.6.0, the July 2026 mechanism review.** Stance and probability in the output block,
Brier-scored calibration, convergence detection with early stopping, scored anonymous ranking,
a synthesis audit, Boardroom mode, a grounding rule, per-org journals, and packaging as a
Claude Code plugin.
